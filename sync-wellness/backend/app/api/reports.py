"""
Reports API - PDF report generation with S3/local storage.
"""
import os
import json
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.wellness import Report, Cycle, MoodLog, Symptom
from app.schemas.wellness import ReportCreate, ReportResponse
from app.core.config import settings

router = APIRouter(prefix="/api/reports", tags=["Reports"])


def _generate_pdf_report(user: User, report_type: str, db: Session) -> str:
    """Generate a PDF report and return local file path."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.units import inch

        os.makedirs(settings.LOCAL_STORAGE_PATH, exist_ok=True)
        filename = f"report_{user.id}_{report_type}_{date.today()}.pdf"
        filepath = os.path.join(settings.LOCAL_STORAGE_PATH, filename)

        doc = SimpleDocTemplate(filepath, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle('Title', parent=styles['Title'], textColor=colors.HexColor('#E91E8C'))
        story.append(Paragraph(f"SYNC Wellness Report — {report_type.capitalize()}", title_style))
        story.append(Paragraph(f"Generated for: {user.name} | Date: {date.today()}", styles['Normal']))
        story.append(Spacer(1, 0.3 * inch))

        disclaimer_style = ParagraphStyle('Disclaimer', parent=styles['Italic'], textColor=colors.gray, fontSize=9)
        story.append(Paragraph(
            "DISCLAIMER: This report contains general wellness observations from your logged data. "
            "It is NOT medical advice. Please consult a qualified healthcare professional for health concerns.",
            disclaimer_style,
        ))
        story.append(Spacer(1, 0.3 * inch))

        if report_type in ("cycle", "monthly"):
            cycles = db.query(Cycle).filter(
                Cycle.user_id == user.id,
                Cycle.period_start >= date.today() - timedelta(days=90),
            ).order_by(Cycle.period_start.desc()).all()

            story.append(Paragraph("Cycle Summary (Last 90 days)", styles['Heading2']))
            if cycles:
                data = [["Period Start", "Period End", "Cycle Length", "Phase"]]
                for c in cycles:
                    data.append([
                        str(c.period_start),
                        str(c.period_end or "—"),
                        f"{c.cycle_length} days",
                        c.current_phase or "—",
                    ])
                table = Table(data)
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E91E8C')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#FFF0F5')]),
                ]))
                story.append(table)
            else:
                story.append(Paragraph("No cycle data logged in the last 90 days.", styles['Normal']))

        if report_type in ("mood", "monthly"):
            story.append(Spacer(1, 0.2 * inch))
            story.append(Paragraph("Mood Summary (Last 30 days)", styles['Heading2']))
            moods = db.query(MoodLog).filter(
                MoodLog.user_id == user.id,
                MoodLog.date >= date.today() - timedelta(days=30),
            ).order_by(MoodLog.date.desc()).all()

            if moods:
                mood_counts = {}
                for m in moods:
                    mood_counts[m.mood] = mood_counts.get(m.mood, 0) + 1

                data = [["Mood", "Count"]]
                for k, v in sorted(mood_counts.items(), key=lambda x: -x[1]):
                    data.append([k.capitalize(), str(v)])

                table = Table(data)
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#9C27B0')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ]))
                story.append(table)

        story.append(Spacer(1, 0.5 * inch))
        story.append(Paragraph(
            "♡ SYNC is more than a tracker — it's your personal wellness partner.",
            ParagraphStyle('Footer', parent=styles['Italic'], textColor=colors.HexColor('#E91E8C'), alignment=1),
        ))

        doc.build(story)
        return filepath

    except ImportError:
        # Fallback plain text if reportlab not installed
        os.makedirs(settings.LOCAL_STORAGE_PATH, exist_ok=True)
        filename = f"report_{user.id}_{report_type}_{date.today()}.txt"
        filepath = os.path.join(settings.LOCAL_STORAGE_PATH, filename)
        with open(filepath, "w") as f:
            f.write(f"SYNC Wellness Report — {report_type.capitalize()}\n")
            f.write(f"Generated: {date.today()}\n")
            f.write("Install reportlab for PDF generation: pip install reportlab\n")
        return filepath


@router.post("/generate", response_model=ReportResponse, status_code=201)
def generate_report(
    r_in: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filepath = _generate_pdf_report(current_user, r_in.report_type, db)
    file_url = None

    if settings.USE_S3 and settings.AWS_S3_BUCKET:
        try:
            import boto3
            s3 = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION,
            )
            key = f"reports/{current_user.id}/{os.path.basename(filepath)}"
            s3.upload_file(filepath, settings.AWS_S3_BUCKET, key)
            file_url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
        except Exception as e:
            print(f"[S3] Upload failed: {e}")

    report = Report(
        user_id=current_user.id,
        report_type=r_in.report_type,
        title=r_in.title,
        file_url=file_url,
        file_path=filepath,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return ReportResponse.model_validate(report)


@router.get("", response_model=List[ReportResponse])
@router.get("/", response_model=List[ReportResponse])
def get_reports(

    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reports = db.query(Report).filter(
        Report.user_id == current_user.id
    ).order_by(Report.generated_at.desc()).all()
    return [ReportResponse.model_validate(r) for r in reports]


@router.get("/{report_id}/download")
def download_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(
        Report.id == report_id, Report.user_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.file_url:
        return {"redirect_url": report.file_url}

    if report.file_path and os.path.exists(report.file_path):
        return FileResponse(report.file_path, filename=os.path.basename(report.file_path))

    raise HTTPException(status_code=404, detail="Report file not found")


@router.delete("/{report_id}", status_code=204)
def delete_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(
        Report.id == report_id, Report.user_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    db.delete(report)
    db.commit()
