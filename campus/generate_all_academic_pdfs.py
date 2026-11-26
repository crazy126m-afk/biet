"""
BIET Davangere - Autonomous Academic Examination Papers & Question Banks Generator
Generates high-fidelity, printable PDF documents matching official VTU & BIET autonomous standards.
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)

def create_paper_pdf(output_path, meta, modules_data):
    """
    Creates an authentic VTU / BIET Autonomous Question Paper or Question Bank PDF.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=32,
        bottomMargin=32
    )

    styles = getSampleStyleSheet()
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        'InstTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=14,
        alignment=1, # Center
        textColor=colors.HexColor('#0a1733')
    )
    
    sub_title_style = ParagraphStyle(
        'InstSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        alignment=1, # Center
        textColor=colors.HexColor('#333333')
    )

    exam_header_style = ParagraphStyle(
        'ExamHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        alignment=1,
        textColor=colors.HexColor('#1f4178')
    )

    q_text_style = ParagraphStyle(
        'QText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#111827')
    )

    q_bold_style = ParagraphStyle(
        'QBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )

    or_style = ParagraphStyle(
        'OrStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        alignment=1,
        textColor=colors.HexColor('#b45309')
    )

    elements = []

    # 1. INSTITUTION HEADER
    elements.append(Paragraph("BAPUJI EDUCATIONAL ASSOCIATION (R.)", sub_title_style))
    elements.append(Paragraph("<b>BAPUJI INSTITUTE OF ENGINEERING & TECHNOLOGY</b>", title_style))
    elements.append(Paragraph("Post Box No. 325, Shamanur Shivashankarappa Marg, Davangere - 577 004, Karnataka<br/><i>(An Autonomous Institution Affiliated to Visvesvaraya Technological University, Belagavi)</i><br/>Accredited by NAAC with 'A' Grade • NBA Accredited UG Programs", sub_title_style))
    elements.append(Spacer(1, 6))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0a1733'), spaceAfter=6))

    # 2. EXAMINATION METADATA
    dept = meta.get('department', 'Department of Computer Science & Engineering')
    sem = meta.get('semester', '5th Sem')
    session = meta.get('exam_session', 'Jan / Feb 2024')
    scheme = meta.get('scheme', '2021 Scheme (Autonomous VTU)')
    sub_code = meta.get('subject_code', '21CS51')
    sub_name = meta.get('subject_name', 'Automata Theory and Computability')
    paper_type = meta.get('type', 'PYQ')
    paper_title = meta.get('title', 'University Examination Final Paper')

    exam_title_str = f"<b>DEPARTMENT OF {dept.upper()}</b><br/><b>{sem.upper()} B.E. DEGREE SEMESTER END EXAMINATIONS — {session.upper()}</b>"
    if paper_type == 'Question Bank':
        exam_title_str = f"<b>DEPARTMENT OF {dept.upper()}</b><br/><b>COMPREHENSIVE DEPARTMENTAL QUESTION BANK (ACADEMIC YEAR 2024-25)</b>"
    elif paper_type == 'Model Paper':
        exam_title_str = f"<b>DEPARTMENT OF {dept.upper()}</b><br/><b>OFFICIAL MODEL QUESTION PAPER & DETAILED MARKING SCHEME</b>"
    
    elements.append(Paragraph(exam_title_str, exam_header_style))
    elements.append(Spacer(1, 6))

    # USN Box Table
    usn_data = [
        ['USN:', '4', 'B', 'D', ' ', ' ', ' ', ' ', ' ', ' ', ' ']
    ]
    usn_table = Table(usn_data, colWidths=[35] + [16]*10, rowHeights=[18])
    usn_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOX', (1,0), (1,0), 0.75, colors.HexColor('#0a1733')),
        ('BOX', (2,0), (2,0), 0.75, colors.HexColor('#0a1733')),
        ('BOX', (3,0), (3,0), 0.75, colors.HexColor('#0a1733')),
        ('BOX', (4,0), (4,0), 0.75, colors.HexColor('#0a1733')),
        ('BOX', (5,0), (5,0), 0.75, colors.HexColor('#0a1733')),
        ('BOX', (6,0), (6,0), 0.75, colors.HexColor('#0a1733')),
        ('BOX', (7,0), (7,0), 0.75, colors.HexColor('#0a1733')),
        ('BOX', (8,0), (8,0), 0.75, colors.HexColor('#0a1733')),
        ('BOX', (9,0), (9,0), 0.75, colors.HexColor('#0a1733')),
        ('BOX', (10,0), (10,0), 0.75, colors.HexColor('#0a1733')),
    ]))

    # Course Details Box
    course_meta_data = [
        [usn_table, Paragraph(f"<b>Course Code:</b> {sub_code}<br/><b>Scheme:</b> {scheme}", q_text_style)],
        [Paragraph(f"<b>Course Title:</b> {sub_name}", q_bold_style), Paragraph(f"<b>Duration:</b> 3 Hours &nbsp;&nbsp;&nbsp;&nbsp; <b>Max Marks:</b> 100", q_text_style)]
    ]
    course_table = Table(course_meta_data, colWidths=[310, 213])
    course_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#0a1733')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(course_table)
    elements.append(Spacer(1, 6))

    # Candidate Instructions
    inst_text = "<b>Instructions to Candidates:</b><br/>" \
                "1. Answer any <b>FIVE</b> full questions, choosing <b>ONE</b> full question from each module.<br/>" \
                "2. <b>M:</b> Marks, <b>BL:</b> Bloom's Taxonomy Level (L1: Remember, L2: Understand, L3: Apply, L4: Analyze), <b>CO:</b> Course Outcome.<br/>" \
                "3. Standard data tables / charts are permitted. Missing data, if any, may be suitably assumed."
    elements.append(Paragraph(inst_text, q_text_style))
    elements.append(Spacer(1, 6))

    # 3. QUESTIONS TABLE
    q_table_rows = [
        [
            Paragraph('<b>Q.No.</b>', q_bold_style),
            Paragraph('<b>Question Description / University Examination Problem Statement</b>', q_bold_style),
            Paragraph('<b>Marks</b>', q_bold_style),
            Paragraph('<b>BL</b>', q_bold_style),
            Paragraph('<b>CO</b>', q_bold_style)
        ]
    ]

    for mod in modules_data:
        mod_num = mod.get('module_num', 1)
        mod_title = mod.get('title', f'Module {mod_num}')
        
        # Module Banner Row
        q_table_rows.append([
            Paragraph(f'<b>MODULE {mod_num}</b>', q_bold_style),
            Paragraph(f'<b>{mod_title.upper()}</b>', q_bold_style),
            '', '', ''
        ])

        # Question A
        q1_no = f"Q.{2*mod_num - 1}"
        q_table_rows.append([
            Paragraph(f'<b>{q1_no}</b>', q_bold_style),
            Paragraph(mod.get('q1_text', 'State and explain core engineering principles with formal proofs and block diagrams.'), q_text_style),
            Paragraph(str(mod.get('q1_marks', 10)), q_text_style),
            Paragraph(mod.get('q1_bl', 'L2'), q_text_style),
            Paragraph(f'CO{mod_num}', q_text_style)
        ])

        # OR Row
        q_table_rows.append([
            '',
            Paragraph('<b>— OR —</b>', or_style),
            '', '', ''
        ])

        # Question B
        q2_no = f"Q.{2*mod_num}"
        q_table_rows.append([
            Paragraph(f'<b>{q2_no}</b>', q_bold_style),
            Paragraph(mod.get('q2_text', 'Solve and analyze the design problem with step-by-step mathematical calculations.'), q_text_style),
            Paragraph(str(mod.get('q2_marks', 10)), q_text_style),
            Paragraph(mod.get('q2_bl', 'L3'), q_text_style),
            Paragraph(f'CO{mod_num}', q_text_style)
        ])

    questions_table = Table(q_table_rows, colWidths=[38, 365, 40, 40, 40])
    
    # Table Styling
    t_style = [
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0a1733')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#94a3b8')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('ALIGN', (0,1), (0,-1), 'CENTER'),
        ('ALIGN', (2,1), (-1,-1), 'CENTER'),
    ]

    # Style module header and OR rows
    row_idx = 1
    for mod in modules_data:
        # Module Banner
        t_style.append(('BACKGROUND', (0, row_idx), (-1, row_idx), colors.HexColor('#e2e8f0')))
        t_style.append(('SPAN', (1, row_idx), (-1, row_idx)))
        row_idx += 1
        # Q1 row
        row_idx += 1
        # OR row
        t_style.append(('BACKGROUND', (0, row_idx), (-1, row_idx), colors.HexColor('#fef3c7')))
        t_style.append(('SPAN', (1, row_idx), (1, row_idx)))
        row_idx += 1
        # Q2 row
        row_idx += 1

    questions_table.setStyle(TableStyle(t_style))
    elements.append(questions_table)
    elements.append(Spacer(1, 10))

    # 4. VALUATION SCHEME & FOOTER
    scheme_text = "<b>Official Scheme of Valuation Summary & Model Solution Breakdown:</b><br/>" \
                  "• <b>Descriptive/Theory Components:</b> Definition & Statement (2M) | Derivation / Architectural Proof (4M) | Neatly labeled circuit / flow schematic (4M).<br/>" \
                  "• <b>Numerical/Design Problems:</b> Governing formula with parameter identification (2M) | Intermediate step evaluation (5M) | Final result with standard SI units (3M).<br/>" \
                  "• <b>Evaluation Standard:</b> Autonomous Evaluation Board, BIET Davangere in strict compliance with VTU Guidelines."
    elements.append(Paragraph(scheme_text, q_text_style))
    elements.append(Spacer(1, 10))

    # Authentication Signature Table
    sig_data = [
        [
            Paragraph("<b>Prepared by:</b><br/>Course Coordinator & Subject Expert<br/>BIET Academic Board", q_text_style),
            Paragraph("<b>Verified & Approved:</b><br/>Head of the Department (HOD)<br/>Department of " + dept, q_text_style),
            Paragraph("<b>Autonomous Seal & Signature:</b><br/>Controller of Examinations (COE)<br/>B.I.E.T., Davangere", q_text_style)
        ]
    ]
    sig_table = Table(sig_data, colWidths=[174, 174, 175])
    sig_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#0a1733')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(sig_table)

    doc.build(elements)
    print(f"✅ Generated authentic PDF: {output_path} ({os.path.getsize(output_path)} bytes)")

print("PDF Generator module loaded successfully.")
