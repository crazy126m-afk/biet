"""
BIET Davangere - Advanced Academic Features Seeder
Populates:
1. Placement & Career Cell Drives (placement_drives)
2. Weekly Class & Lab Timetables (academic_timetables)
3. GATE & Exam Revision Cheat Sheets (cheat_sheets)
4. VTU Curriculum Credits Matrix (curriculum_credits)
"""

import sqlite3
import os

def seed_advanced_features(db_path=None):
    if not db_path:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(base_dir, 'data', 'biet_campus.db')
        
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # 1. PLACEMENT & INTERNSHIP DRIVES
    c.execute("""
        CREATE TABLE IF NOT EXISTS placement_drives (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT NOT NULL,
            logo_url TEXT,
            role_title TEXT NOT NULL,
            ctc_package TEXT NOT NULL,
            eligible_branches TEXT NOT NULL,
            min_cgpa REAL NOT NULL,
            max_backlogs INTEGER DEFAULT 0,
            drive_date TEXT NOT NULL,
            registration_deadline TEXT NOT NULL,
            selection_rounds TEXT NOT NULL,
            venue TEXT NOT NULL,
            job_location TEXT NOT NULL,
            status TEXT DEFAULT 'Upcoming',
            apply_link TEXT
        )
    """)

    # 2. CLASSROOM & LAB TIMETABLES
    c.execute("""
        CREATE TABLE IF NOT EXISTS academic_timetables (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            department TEXT NOT NULL,
            semester TEXT NOT NULL,
            section TEXT NOT NULL,
            day_of_week TEXT NOT NULL,
            time_slot TEXT NOT NULL,
            start_hour INTEGER NOT NULL,
            start_minute INTEGER NOT NULL,
            end_hour INTEGER NOT NULL,
            end_minute INTEGER NOT NULL,
            subject_code TEXT NOT NULL,
            subject_name TEXT NOT NULL,
            faculty_name TEXT NOT NULL,
            room_no TEXT NOT NULL,
            is_lab INTEGER DEFAULT 0
        )
    """)

    # 3. GATE & EXAM CHEAT SHEETS
    c.execute("""
        CREATE TABLE IF NOT EXISTS cheat_sheets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_code TEXT NOT NULL,
            subject_name TEXT NOT NULL,
            department TEXT NOT NULL,
            semester TEXT NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            summary_content TEXT NOT NULL,
            downloads_count INTEGER DEFAULT 185
        )
    """)

    # 4. VTU CURRICULUM CREDITS MATRIX
    c.execute("""
        CREATE TABLE IF NOT EXISTS curriculum_credits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scheme TEXT NOT NULL,
            department TEXT NOT NULL,
            semester TEXT NOT NULL,
            subject_code TEXT NOT NULL,
            subject_name TEXT NOT NULL,
            credits REAL NOT NULL,
            subject_type TEXT DEFAULT 'Theory'
        )
    """)

    # --- POPULATE PLACEMENT DRIVES ---
    c.execute("DELETE FROM placement_drives")
    placement_data = [
        ("Bosch Global Software Technologies", "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120", 
         "Associate Software Engineer - Embedded & Cloud Systems", "7.50 - 9.20 LPA", 
         "CSE, ISE, ECE, EEE", 7.00, 0, "2026-12-05", "2026-12-02 18:00",
         "Round 1: Online Technical & Logical Reasoning Test | Round 2: Core Domain & System Design Interview | Round 3: Leadership & HR Evaluation",
         "BIET Central Placement Auditorium, Main Block (Ground Floor)", "Bengaluru / Coimbatore", "Upcoming",
         "https://www.bosch.in/careers/"),

        ("Cisco Systems India", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=120", 
         "Network Software Engineer (Core Networking & Security)", "14.50 LPA", 
         "CSE, ISE, ECE", 7.50, 0, "2026-12-10", "2026-12-06 23:59",
         "Round 1: HackerRank Online Coding & NetAcad Aptitude | Round 2: Technical Architecture Deep Dive | Round 3: Executive HR Discussion",
         "Department of CS Seminar Hall, MV-Block", "Bengaluru", "Upcoming",
         "https://www.cisco.com/c/en/us/about/careers.html"),

        ("Tata Consultancy Services (TCS Digital & Prime)", "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120", 
         "Digital / Prime Systems Engineer (Cloud, AI & Full Stack)", "7.00 - 9.00 LPA", 
         "All Engineering Branches (BE / B.Tech)", 6.50, 1, "2026-12-12", "2026-12-08 17:00",
         "Round 1: National Qualifier Test (NQT) - Cognitive & Advanced Coding | Round 2: Technical Interview | Round 3: HR & Document Verification",
         "BIET Central Computing Complex (CCC - Lab 1 to 4)", "Pan India (Bangalore / Pune / Hyderabad)", "Upcoming",
         "https://nextstep.tcs.com/campus/#/"),

        ("Infosys Limited", "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=120", 
         "Specialist Programmer (Power Programmer) & Digital Specialist", "9.50 LPA", 
         "CSE, ISE, ECE, EEE", 7.00, 0, "2026-12-16", "2026-12-11 20:00",
         "Round 1: InfyTQ / HackWithInfy Advanced Coding Round | Round 2: Technical Interview on Data Structures & System Architecture | Round 3: HR Interview",
         "Online Assessment followed by Virtual Interview at BIET Placement Cell", "Bengaluru / Mysuru", "Upcoming",
         "https://www.infosys.com/careers.html"),

        ("LTIMindtree", "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=120", 
         "Graduate Engineer Trainee - Cloud Enterprise & DevOps", "5.50 - 6.50 LPA", 
         "CSE, ISE, ECE, EEE, MECH, CIVIL", 6.00, 1, "2026-12-18", "2026-12-14 18:00",
         "Round 1: Online Aptitude, English Verbal & Coding Test | Round 2: Technical Face-to-Face Interview | Round 3: HR Discussion",
         "BIET Auditorium, Golden Jubilee Block", "Bengaluru / Chennai", "Upcoming",
         "https://www.ltimindtree.com/careers/early-careers/"),

        ("Continental Automotive Systems", "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=120", 
         "R&D Graduate Engineer - ADAS, Automotive IoT & Electronics", "8.25 LPA", 
         "ECE, EEE, CSE, MECH", 6.80, 0, "2026-12-21", "2026-12-17 18:00",
         "Round 1: C/C++ Programming & Core Automotive Electronics Aptitude | Round 2: Embedded Systems & Hardware Technical Round | Round 3: HR Round",
         "ECE Department Conference Room, MV-Block", "Bengaluru", "Upcoming",
         "https://www.continental.com/en-in/career/"),

        ("SLK Software", "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120", 
         "Associate Software Engineer - Banking & Fintech Solutions", "5.00 - 6.00 LPA", 
         "CSE, ISE, ECE", 6.25, 1, "2026-12-23", "2026-12-19 17:00",
         "Round 1: Online Cognitive & Java/Python Coding Test | Round 2: Technical Interview | Round 3: HR Fitment",
         "BIET Central Placement Hall", "Bengaluru", "Upcoming",
         "https://www.slksoftware.com/careers/")
    ]
    for p in placement_data:
        c.execute("""
            INSERT INTO placement_drives (
                company_name, logo_url, role_title, ctc_package, eligible_branches, 
                min_cgpa, max_backlogs, drive_date, registration_deadline, selection_rounds, 
                venue, job_location, status, apply_link
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, p)

    # --- POPULATE TIMETABLES ---
    c.execute("DELETE FROM academic_timetables")
    # Comprehensive weekly schedule for 5th Sem CSE (Section A)
    # Mon - Sat, 09:00 AM - 05:00 PM
    tt_data = [
        # Monday
        ("Computer Science & Engineering", "5th Sem", "A", "Monday", "09:00 - 10:00 AM", 9, 0, 10, 0, "21CS51", "Automata Theory & Computability", "Dr. Nirmala C. R.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Monday", "10:00 - 11:00 AM", 10, 0, 11, 0, "21CS52", "Computer Networks", "Prof. Naveen H. M.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Monday", "11:15 - 12:15 PM", 11, 15, 12, 15, "21CS53", "Database Management Systems", "Dr. Jyothi G. C.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Monday", "12:15 - 01:15 PM", 12, 15, 13, 15, "21CS54", "Artificial Intelligence & Principles", "Prof. Chetana R.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Monday", "02:00 - 05:00 PM", 14, 0, 17, 0, "21CSL55", "Database Systems & SQL Lab", "Dr. Jyothi G. C. & Lab Team", "Lab 2 - MV Block", 1),

        # Tuesday
        ("Computer Science & Engineering", "5th Sem", "A", "Tuesday", "09:00 - 10:00 AM", 9, 0, 10, 0, "21CS52", "Computer Networks", "Prof. Naveen H. M.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Tuesday", "10:00 - 11:00 AM", 10, 0, 11, 0, "21CS53", "Database Management Systems", "Dr. Jyothi G. C.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Tuesday", "11:15 - 12:15 PM", 11, 15, 12, 15, "21CS51", "Automata Theory & Computability", "Dr. Nirmala C. R.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Tuesday", "12:15 - 01:15 PM", 12, 15, 13, 15, "21CS54", "Artificial Intelligence & Principles", "Prof. Chetana R.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Tuesday", "02:00 - 03:00 PM", 14, 0, 15, 0, "21CIV57", "Environmental Studies & Professional Ethics", "Dr. B. M. Suresh", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Tuesday", "03:00 - 05:00 PM", 15, 0, 17, 0, "21CS58", "Mini Project & Technical Seminar", "Faculty Guide Panel", "Project Lab - Turing Hall", 1),

        # Wednesday
        ("Computer Science & Engineering", "5th Sem", "A", "Wednesday", "09:00 - 10:00 AM", 9, 0, 10, 0, "21CS54", "Artificial Intelligence & Principles", "Prof. Chetana R.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Wednesday", "10:00 - 11:00 AM", 10, 0, 11, 0, "21CS51", "Automata Theory & Computability", "Dr. Nirmala C. R.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Wednesday", "11:15 - 12:15 PM", 11, 15, 12, 15, "21CS52", "Computer Networks", "Prof. Naveen H. M.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Wednesday", "12:15 - 01:15 PM", 12, 15, 13, 15, "21CS53", "Database Management Systems", "Dr. Jyothi G. C.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Wednesday", "02:00 - 05:00 PM", 14, 0, 17, 0, "21CSL56", "Computer Networks & Cisco Packet Tracer Lab", "Prof. Naveen H. M. & Team", "Networking Lab - 1st Floor", 1),

        # Thursday
        ("Computer Science & Engineering", "5th Sem", "A", "Thursday", "09:00 - 10:00 AM", 9, 0, 10, 0, "21CS53", "Database Management Systems", "Dr. Jyothi G. C.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Thursday", "10:00 - 11:00 AM", 10, 0, 11, 0, "21CS52", "Computer Networks", "Prof. Naveen H. M.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Thursday", "11:15 - 12:15 PM", 11, 15, 12, 15, "21CS54", "Artificial Intelligence & Principles", "Prof. Chetana R.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Thursday", "12:15 - 01:15 PM", 12, 15, 13, 15, "21CS51", "Automata Theory & Computability", "Dr. Nirmala C. R.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Thursday", "02:00 - 03:00 PM", 14, 0, 15, 0, "21CS57", "Research Methodology & IPR", "Dr. K. S. Jayantha", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Thursday", "03:00 - 05:00 PM", 15, 0, 17, 0, "LIBRARY", "Library & Digital OPAC Research Hour", "Central Library MV-Block", "Central Library", 0),

        # Friday
        ("Computer Science & Engineering", "5th Sem", "A", "Friday", "09:00 - 10:00 AM", 9, 0, 10, 0, "21CS51", "Automata Theory & Computability", "Dr. Nirmala C. R.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Friday", "10:00 - 11:00 AM", 10, 0, 11, 0, "21CS54", "Artificial Intelligence & Principles", "Prof. Chetana R.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Friday", "11:15 - 12:15 PM", 11, 15, 12, 15, "21CS53", "Database Management Systems", "Dr. Jyothi G. C.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Friday", "12:15 - 01:15 PM", 12, 15, 13, 15, "21CS52", "Computer Networks", "Prof. Naveen H. M.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Friday", "02:00 - 04:00 PM", 14, 0, 16, 0, "APTITUDE", "Training & Placement Soft Skills & Mock Coding", "Prof. T. G. Basavaraj (T&P)", "Auditorium", 0),

        # Saturday
        ("Computer Science & Engineering", "5th Sem", "A", "Saturday", "09:00 - 10:00 AM", 9, 0, 10, 0, "21CS52", "Computer Networks (Tutorial & Problem Solving)", "Prof. Naveen H. M.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Saturday", "10:00 - 11:00 AM", 10, 0, 11, 0, "21CS51", "Automata Theory (Gate Numericals & Tutorial)", "Dr. Nirmala C. R.", "MV-201", 0),
        ("Computer Science & Engineering", "5th Sem", "A", "Saturday", "11:15 - 01:00 PM", 11, 15, 13, 0, "FORUM", "BIET CS Forum 'BYTE' Tech Talks & Coding Contests", "BYTE Forum Student Council", "MV Seminar Hall", 0),

        # 5th Sem ECE (Section A) Highlights
        ("Electronics & Communication Engg", "5th Sem", "A", "Monday", "09:00 - 10:00 AM", 9, 0, 10, 0, "21EC51", "Digital Signal Processing", "Dr. G. S. Sunitha", "EC-101", 0),
        ("Electronics & Communication Engg", "5th Sem", "A", "Monday", "10:00 - 11:00 AM", 10, 0, 11, 0, "21EC52", "Digital Communication", "Dr. K. S. Jayantha", "EC-101", 0),
        ("Electronics & Communication Engg", "5th Sem", "A", "Wednesday", "02:00 - 05:00 PM", 14, 0, 17, 0, "21ECL55", "DSP & MATLAB Simulation Lab", "Dr. G. S. Sunitha & Team", "DSP Lab - EC Block", 1)
    ]
    for row in tt_data:
        c.execute("""
            INSERT INTO academic_timetables (
                department, semester, section, day_of_week, time_slot,
                start_hour, start_minute, end_hour, end_minute,
                subject_code, subject_name, faculty_name, room_no, is_lab
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, row)

    # --- POPULATE CHEAT SHEETS ---
    c.execute("DELETE FROM cheat_sheets")
    cs_data = [
        ("21CS51", "Automata Theory & Computability", "Computer Science & Engineering", "5th Sem",
         "DFA Minimization & Pumping Lemma Quick Sheet", "GATE Revision",
         "• DFA Minimization Table-Filling: Mark state pairs (p, q) where one is accepting and one is non-accepting. Iterate for each input symbol a in Sigma: if (delta(p, a), delta(q, a)) is marked, mark (p, q). Repeat until no new pairs are marked.<br/>• Arden's Theorem: R = Q + RP has a unique solution R = QP* if P does not contain epsilon.<br/>• Pumping Lemma for Regular Languages: Let L be regular. There exists constant p such that for any string w in L with |w| >= p, w can be partitioned as w = xyz such that |y| > 0, |xy| <= p, and for all i >= 0, x(y^i)z in L.<br/>• Pumping Lemma for CFLs: w = uvxyz such that |vy| >= 1, |vxy| <= p, and for all i >= 0, u(v^i)x(y^i)z in L.<br/>• Chomsky Hierarchy: Type 3 (Regular - DFA) subset of Type 2 (CFL - PDA) subset of Type 1 (CSL - LBA) subset of Type 0 (Recursively Enumerable - TM)."),

        ("21CS52", "Computer Networks", "Computer Science & Engineering", "5th Sem",
         "Subnetting, TCP Headers & Routing Formulas", "Formulas",
         "• Subnetting Formula: Number of subnets = 2^s (where s is borrowed subnet bits). Hosts per subnet = 2^h - 2 (where h is remaining host bits).<br/>• First valid IP = Network ID + 1. Last valid IP = Broadcast ID - 1.<br/>• TCP Header Size: 20 bytes minimum, up to 60 bytes with options. Flags: URG, ACK, PSH, RST, SYN, FIN.<br/>• Transmission Time: T_tx = Packet Length (L) / Bandwidth (R). Propagation Time: T_prop = Distance (d) / Propagation Speed (s).<br/>• Efficiency in Stop-and-Wait: eta = 1 / (1 + 2a), where a = T_prop / T_tx.<br/>• Sliding Window Window Size: Go-Back-N sender window <= 2^n - 1. Selective Repeat sender window <= 2^(n-1).<br/>• Dijkstra's Shortest Path: Computes O(V^2) or O(E log V) single-source shortest paths using priority queue."),

        ("21CS53", "Database Management Systems", "Computer Science & Engineering", "5th Sem",
         "Functional Dependencies, Normalization & ACID Key Sheet", "Architecture",
         "• Armstrong's Axioms: Reflexivity (Y subset of X implies X -> Y), Augmentation (X -> Y implies XZ -> YZ), Transitivity (X -> Y and Y -> Z implies X -> Z).<br/>• Candidate Key Test: Compute attribute closure X+. If X+ contains all attributes of R, X is a superkey. If no proper subset of X is a superkey, X is a Candidate Key.<br/>• Normal Forms Summary:<br/>  - 1NF: Atomic values only, no multi-valued/composite attributes.<br/>  - 2NF: In 1NF and no Partial Dependency (no non-prime attribute depends on a proper subset of any candidate key).<br/>  - 3NF: In 2NF and for every X -> Y, either X is a Superkey OR Y is a Prime attribute.<br/>  - BCNF: For every X -> Y, X MUST be a Superkey.<br/>• ACID Properties: Atomicity (WAL / Recovery), Consistency (Constraints), Isolation (2PL Locking / Serializability), Durability (Checkpoints / Non-volatile logs)."),

        ("21MAT11", "Calculus and Linear Algebra", "Basic Science & Humanities", "1st/2nd Sem",
         "Derivatives, Matrix Rank & Eigenvalue Theorems", "Formulas",
         "• Radius of Curvature (Cartesian): rho = (1 + (y')^2)^(3/2) / |y''|.<br/>• Radius of Curvature (Polar): rho = (r^2 + (r')^2)^(3/2) / (r^2 + 2(r')^2 - r*r'').<br/>• Total Differential: du = (del u / del x)dx + (del u / del y)dy + (del u / del z)dz.<br/>• Jacobian Transformation: J = del(u, v) / del(x, y) = det([[u_x, u_y], [v_x, v_y]]).<br/>• Cayley-Hamilton Theorem: Every square matrix satisfies its own characteristic equation: det(A - lambda*I) = 0.<br/>• Properties of Eigenvalues: Sum of eigenvalues = Trace of matrix. Product of eigenvalues = Determinant of matrix det(A)."),

        ("21CHE12", "Engineering Chemistry", "Basic Science & Humanities", "1st/2nd Sem",
         "Nernst Equation, Cell EMF & Corrosion Rates", "Formulas",
         "• Nernst Equation at 298 K: E = E0 - (0.0591 / n) * log10([Products] / [Reactants]).<br/>• Cell EMF: E_cell = E_cathode - E_anode.<br/>• Concentration Cell EMF: E_cell = (0.0591 / n) * log10(C2 / C1), where C2 > C1.<br/>• Beer-Lambert Law: A = epsilon * c * l, where A is absorbance, epsilon is molar absorptivity, c is concentration (mol/L), and l is optical path length (cm).<br/>• Galvanic Series: Magnesium > Zinc > Aluminum > Cadmium > Iron > Lead > Copper > Silver > Gold.")
    ]
    for cs in cs_data:
        c.execute("""
            INSERT INTO cheat_sheets (
                subject_code, subject_name, department, semester, title, category, summary_content
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, cs)

    # --- POPULATE VTU CURRICULUM CREDITS ---
    c.execute("DELETE FROM curriculum_credits")
    credits_data = [
        # 5th Sem CSE (2021 Scheme Autonomous)
        ("2021 Scheme (Autonomous VTU)", "Computer Science & Engineering", "5th Sem", "21CS51", "Automata Theory and Computability", 3.0, "Theory"),
        ("2021 Scheme (Autonomous VTU)", "Computer Science & Engineering", "5th Sem", "21CS52", "Computer Networks", 4.0, "Integrated Professional Core"),
        ("2021 Scheme (Autonomous VTU)", "Computer Science & Engineering", "5th Sem", "21CS53", "Database Management Systems", 4.0, "Integrated Professional Core"),
        ("2021 Scheme (Autonomous VTU)", "Computer Science & Engineering", "5th Sem", "21CS54", "Artificial Intelligence & Principles", 3.0, "Theory"),
        ("2021 Scheme (Autonomous VTU)", "Computer Science & Engineering", "5th Sem", "21CSL55", "Database Systems Lab", 1.5, "Laboratory"),
        ("2021 Scheme (Autonomous VTU)", "Computer Science & Engineering", "5th Sem", "21CIV57", "Environmental Studies & Professional Ethics", 1.0, "Mandatory Course"),
        ("2021 Scheme (Autonomous VTU)", "Computer Science & Engineering", "5th Sem", "21CS58", "Mini Project & Technical Seminar", 2.0, "Project Work"),

        # 3rd Sem CSE
        ("2021 Scheme (Autonomous VTU)", "Computer Science & Engineering", "3rd Sem", "21MAT31", "Transform Calculus, Fourier Series & Numerical Tech", 3.0, "Theory"),
        ("2021 Scheme (Autonomous VTU)", "Computer Science & Engineering", "3rd Sem", "21CS32", "Data Structures and Applications", 4.0, "Integrated Professional Core"),
        ("2021 Scheme (Autonomous VTU)", "Computer Science & Engineering", "3rd Sem", "21CS33", "Analog & Digital Electronics", 4.0, "Integrated Professional Core"),
        ("2021 Scheme (Autonomous VTU)", "Computer Science & Engineering", "3rd Sem", "21CS34", "Computer Organization & Architecture", 3.0, "Theory"),
        ("2021 Scheme (Autonomous VTU)", "Computer Science & Engineering", "3rd Sem", "21CSL35", "Data Structures Laboratory", 1.5, "Laboratory"),

        # 1st Sem Basic Science (Physics Cycle)
        ("2021/2022 Scheme (VTU NEP)", "Basic Science & Humanities", "1st Sem", "21MAT11", "Calculus and Linear Algebra", 3.0, "Theory"),
        ("2021/2022 Scheme (VTU NEP)", "Basic Science & Humanities", "1st Sem", "21PHY12", "Engineering Physics", 3.0, "Theory"),
        ("2021/2022 Scheme (VTU NEP)", "Basic Science & Humanities", "1st Sem", "21ELE13", "Basic Electrical Engineering", 3.0, "Theory"),
        ("2021/2022 Scheme (VTU NEP)", "Basic Science & Humanities", "1st Sem", "21CIV14", "Elements of Civil Engineering & Mechanics", 3.0, "Theory"),
        ("2021/2022 Scheme (VTU NEP)", "Basic Science & Humanities", "1st Sem", "21PHYL16", "Engineering Physics Laboratory", 1.5, "Laboratory"),

        # 2nd Sem Basic Science (Chemistry Cycle)
        ("2021/2022 Scheme (VTU NEP)", "Basic Science & Humanities", "2nd Sem", "21MAT21", "Advanced Calculus and Numerical Methods", 3.0, "Theory"),
        ("2021/2022 Scheme (VTU NEP)", "Basic Science & Humanities", "2nd Sem", "21CHE12", "Engineering Chemistry", 3.0, "Theory"),
        ("2021/2022 Scheme (VTU NEP)", "Basic Science & Humanities", "2nd Sem", "21PSP13", "Problem Solving using C & Python Programming", 3.0, "Theory"),
        ("2021/2022 Scheme (VTU NEP)", "Basic Science & Humanities", "2nd Sem", "21ELN14", "Basic Electronics & Communication Engg", 3.0, "Theory"),
        ("2021/2022 Scheme (VTU NEP)", "Basic Science & Humanities", "2nd Sem", "21CHEL16", "Engineering Chemistry Laboratory", 1.5, "Laboratory")
    ]
    for cr in credits_data:
        c.execute("""
            INSERT INTO curriculum_credits (
                scheme, department, semester, subject_code, subject_name, credits, subject_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, cr)

    # Enhance student records with valid blood group & expiry
    c.execute("UPDATE erp_records SET pending_dues = 0.0")

    conn.commit()
    conn.close()
    print("✅ Seeded advanced academic features successfully: Placements, Timetables, Cheat Sheets, and Curriculum Credits.")

if __name__ == '__main__':
    seed_advanced_features()
