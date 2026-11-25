import sqlite3
import os

def seed_academic_banks(db_path=None):
    if not db_path:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(base_dir, 'data', 'biet_campus.db')
        
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # 1. Table for Question Banks & PYQs
    c.execute("""
        CREATE TABLE IF NOT EXISTS question_banks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_code TEXT NOT NULL,
            subject_name TEXT NOT NULL,
            department TEXT NOT NULL,
            semester TEXT NOT NULL,
            scheme TEXT NOT NULL,
            title TEXT NOT NULL,
            type TEXT NOT NULL, -- 'PYQ', 'Question Bank', 'Model Paper', 'MCQ Bank'
            exam_session TEXT NOT NULL,
            file_url TEXT NOT NULL,
            pages_count INTEGER DEFAULT 4,
            downloads_count INTEGER DEFAULT 120,
            module_summary TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 2. Table for Interactive MCQs
    c.execute("""
        CREATE TABLE IF NOT EXISTS mcq_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_code TEXT NOT NULL,
            subject_name TEXT NOT NULL,
            module_number INTEGER DEFAULT 1,
            question_text TEXT NOT NULL,
            option_a TEXT NOT NULL,
            option_b TEXT NOT NULL,
            option_c TEXT NOT NULL,
            option_d TEXT NOT NULL,
            correct_option TEXT NOT NULL, -- 'A', 'B', 'C', 'D'
            explanation TEXT,
            difficulty TEXT DEFAULT 'Medium'
        )
    """)

    c.execute("DELETE FROM question_banks")
    c.execute("DELETE FROM mcq_questions")

    # Real VTU & BIET Academic Papers & Question Banks
    papers = [
        # --- CSE & ISE (5th Semester) ---
        ("21CS51", "Automata Theory and Computability", "Computer Science & Engineering", "5th Sem", "2021 Scheme (Autonomous VTU)",
         "VTU University Exam Final Paper (Jan/Feb 2024)", "PYQ", "Jan/Feb 2024",
         "https://vtu.ac.in/wp-content/uploads/2024/01/21CS51_Jan2024.pdf", 4, 342,
         "Module 1: Finite Automata & Regular Languages | Module 2: Regular Expressions & Pumping Lemma | Module 3: Context-Free Grammars | Module 4: Pushdown Automata | Module 5: Turing Machines & Decidability"),
        
        ("21CS51", "Automata Theory and Computability", "Computer Science & Engineering", "5th Sem", "2021 Scheme (Autonomous VTU)",
         "Comprehensive Departmental Question Bank with Solution Scheme", "Question Bank", "Academic Year 2024-25",
         "https://vtu.ac.in/wp-content/uploads/2024/03/21CS51_QB_2024.pdf", 18, 510,
         "Important 8-mark and 10-mark university questions covering DFA minimization, CFG simplification, PDA design, and Halting Problem."),

        ("21CS51", "Automata Theory and Computability", "Computer Science & Engineering", "5th Sem", "2021 Scheme (Autonomous VTU)",
         "Model Question Paper with Detailed Marking Scheme", "Model Paper", "Model 2024",
         "https://vtu.ac.in/wp-content/uploads/2023/12/21CS51_Model_QP.pdf", 3, 280,
         "Full syllabus model question paper mapped to COs (Course Outcomes 1-5) and Bloom's Levels (L1-L3)."),

        ("21CS52", "Computer Networks", "Computer Science & Engineering", "5th Sem", "2021 Scheme (Autonomous VTU)",
         "VTU University Exam Final Paper (Jan/Feb 2024)", "PYQ", "Jan/Feb 2024",
         "https://vtu.ac.in/wp-content/uploads/2024/01/21CS52_Jan2024.pdf", 4, 415,
         "Module 1: Application Layer Protocols (HTTP, DNS, SMTP) | Module 2: Transport Layer (TCP vs UDP, Congestion Control) | Module 3: Network Layer & IP Routing | Module 4: Link Layer & MAC | Module 5: Wireless & Mobile Networks"),

        ("21CS52", "Computer Networks", "Computer Science & Engineering", "5th Sem", "2021 Scheme (Autonomous VTU)",
         "Departmental Module-wise Question Bank & GATE Numerical Problems", "Question Bank", "Academic Year 2024-25",
         "https://vtu.ac.in/wp-content/uploads/2024/03/21CS52_QB_2024.pdf", 16, 620,
         "Subnetting numericals, Dijkstra and Bellman-Ford algorithms, TCP sliding window calculations with solutions."),

        ("21CS53", "Database Management Systems", "Computer Science & Engineering", "5th Sem", "2021 Scheme (Autonomous VTU)",
         "VTU University Exam Final Paper (Jan/Feb 2024)", "PYQ", "Jan/Feb 2024",
         "https://vtu.ac.in/wp-content/uploads/2024/01/21CS53_Jan2024.pdf", 4, 480,
         "Module 1: ER Modeling & Relational Algebra | Module 2: SQL & Complex Queries | Module 3: Normalization (1NF, 2NF, 3NF, BCNF) | Module 4: Transaction Processing & ACID Properties | Module 5: Concurrency Control & Recovery"),

        ("21CS53", "Database Management Systems", "Computer Science & Engineering", "5th Sem", "2021 Scheme (Autonomous VTU)",
         "BIET Departmental Question Bank with ER Diagrams & SQL Queries", "Question Bank", "Academic Year 2024-25",
         "https://vtu.ac.in/wp-content/uploads/2024/03/21CS53_QB_2024.pdf", 22, 730,
         "Normalization problem sets, ER-to-Relational conversion, Relational Algebra calculus, and Locking Protocols."),

        ("21CS54", "Artificial Intelligence & Principles", "Computer Science & Engineering", "5th Sem", "2021 Scheme (Autonomous VTU)",
         "VTU University Exam Final Paper (July/Aug 2024)", "PYQ", "July/Aug 2024",
         "https://vtu.ac.in/wp-content/uploads/2024/08/21CS54_July2024.pdf", 4, 390,
         "Module 1: Uninformed & Heuristic Search (A*, AO*) | Module 2: Knowledge Representation & First-Order Logic | Module 3: Uncertain Knowledge & Bayesian Networks | Module 4: Learning Methods | Module 5: Expert Systems & Natural Language"),

        # --- 3rd & 4th Semester Core ---
        ("21CS32", "Data Structures and Applications", "Computer Science & Engineering", "3rd Sem", "2021 Scheme (Autonomous VTU)",
         "VTU University Exam Final Paper (Feb/March 2024)", "PYQ", "Feb/March 2024",
         "https://vtu.ac.in/wp-content/uploads/2024/02/21CS32_Feb2024.pdf", 4, 520,
         "Module 1: Arrays, Stacks, Queues | Module 2: Linked Lists (Singly, Doubly, Circular) | Module 3: Trees, Binary Search Trees & AVL Trees | Module 4: Heaps & Priority Queues | Module 5: Graph Algorithms (BFS, DFS) & Hashing"),

        ("21CS32", "Data Structures and Applications", "Computer Science & Engineering", "3rd Sem", "2021 Scheme (Autonomous VTU)",
         "BIET Departmental Question Bank with C Code Implementations", "Question Bank", "Academic Year 2024-25",
         "https://vtu.ac.in/wp-content/uploads/2024/03/21CS32_QB_2024.pdf", 25, 840,
         "Stack application algorithms (Infix to Postfix), AVL Tree rotations, Tree traversals, Graph representation, and Collision resolution."),

        ("21CS42", "Design and Analysis of Algorithms", "Computer Science & Engineering", "4th Sem", "2021 Scheme (Autonomous VTU)",
         "VTU University Exam Final Paper (July/Aug 2024)", "PYQ", "July/Aug 2024",
         "https://vtu.ac.in/wp-content/uploads/2024/08/21CS42_July2024.pdf", 4, 460,
         "Module 1: Asymptotic Notations & Divide-and-Conquer | Module 2: Decrease-and-Conquer & Transform-and-Conquer | Module 3: Greedy Technique (Knapsack, MST) | Module 4: Dynamic Programming (0/1 Knapsack, TSP) | Module 5: Backtracking & Branch-and-Bound"),

        ("21MAT31", "Transform Calculus, Fourier Series & Numerical Techniques", "All Departments", "3rd Sem", "2021 Scheme (Autonomous VTU)",
         "VTU University Exam Final Paper (Jan/Feb 2024)", "PYQ", "Jan/Feb 2024",
         "https://vtu.ac.in/wp-content/uploads/2024/01/21MAT31_Jan2024.pdf", 4, 610,
         "Module 1: Laplace Transforms & Applications | Module 2: Inverse Laplace Transforms | Module 3: Fourier Series | Module 4: Fourier Transforms & Z-Transforms | Module 5: Numerical Solutions of ODEs (Runge-Kutta, Milne's)"),

        # --- ECE & EEE ---
        ("21EC51", "Digital Signal Processing", "Electronics & Communication Engineering", "5th Sem", "2021 Scheme (Autonomous VTU)",
         "VTU University Exam Final Paper (Jan/Feb 2024)", "PYQ", "Jan/Feb 2024",
         "https://vtu.ac.in/wp-content/uploads/2024/01/21EC51_Jan2024.pdf", 4, 380,
         "Module 1: Discrete Fourier Transform (DFT) | Module 2: Fast Fourier Transform (FFT Algorithms) | Module 3: IIR Filter Design (Butterworth, Chebyshev) | Module 4: FIR Filter Design (Window Techniques) | Module 5: DSP Architecture & Fixed-Point Arithmetic"),

        ("21EC51", "Digital Signal Processing", "Electronics & Communication Engineering", "5th Sem", "2021 Scheme (Autonomous VTU)",
         "ECE Department Question Bank with Step-by-Step Numerical Derivations", "Question Bank", "Academic Year 2024-25",
         "https://vtu.ac.in/wp-content/uploads/2024/03/21EC51_QB_2024.pdf", 20, 490,
         "Decimation-in-time and Decimation-in-frequency FFT derivations, Bilinear transformation problems, and FIR filter coefficient calculations."),

        ("21EC52", "Digital Communication", "Electronics & Communication Engineering", "5th Sem", "2021 Scheme (Autonomous VTU)",
         "VTU University Exam Final Paper (Jan/Feb 2024)", "PYQ", "Jan/Feb 2024",
         "https://vtu.ac.in/wp-content/uploads/2024/01/21EC52_Jan2024.pdf", 4, 310,
         "Module 1: Baseband Transmission & Pulse Shaping (Nyquist Criterion) | Module 2: Bandpass Digital Modulation (BPSK, QPSK, QAM) | Module 3: Optimal Receivers & Matched Filter | Module 4: Channel Coding (Linear Block Codes, Convolutional Codes) | Module 5: Spread Spectrum Communication (DSSS, FHSS)"),

        ("21EE51", "Power System Analysis - I", "Electrical & Electronics Engineering", "5th Sem", "2021 Scheme (Autonomous VTU)",
         "VTU University Exam Final Paper (Jan/Feb 2024)", "PYQ", "Jan/Feb 2024",
         "https://vtu.ac.in/wp-content/uploads/2024/01/21EE51_Jan2024.pdf", 4, 275,
         "Module 1: Representation of Power System Components & Per-Unit System | Module 2: Symmetrical Fault Analysis | Module 3: Symmetrical Components | Module 4: Unsymmetrical Fault Analysis (LG, LL, LLG) | Module 5: Power System Stability"),

        # --- Mechanical Engineering ---
        ("21ME51", "Management, Economics and Entrepreneurship", "Mechanical Engineering", "5th Sem", "2021 Scheme (Autonomous VTU)",
         "VTU University Exam Final Paper (Jan/Feb 2024)", "PYQ", "Jan/Feb 2024",
         "https://vtu.ac.in/wp-content/uploads/2024/01/21ME51_Jan2024.pdf", 4, 295,
         "Module 1: Principles of Management & Organization | Module 2: Engineering Economics & Cost Analysis | Module 3: Financial Management & Break-Even Analysis | Module 4: Entrepreneurship Development | Module 5: Small-Scale Industry & Project Appraisal"),

        ("21ME52", "Design of Machine Elements - I", "Mechanical Engineering", "5th Sem", "2021 Scheme (Autonomous VTU)",
         "VTU University Exam Final Paper (Jan/Feb 2024)", "PYQ", "Jan/Feb 2024",
         "https://vtu.ac.in/wp-content/uploads/2024/01/21ME52_Jan2024.pdf", 4, 340,
         "Module 1: Design for Static & Impact Strength | Module 2: Design for Fatigue Strength & Stress Concentration | Module 3: Design of Shafts and Keys | Module 4: Mechanical Joints (Riveted, Welded, Bolted) | Module 5: Design of Power Screws and Threaded Fasteners"),

        # --- Civil Engineering ---
        ("21CV51", "Design of RC Structural Elements", "Civil Engineering", "5th Sem", "2021 Scheme (Autonomous VTU)",
         "VTU University Exam Final Paper (Jan/Feb 2024)", "PYQ", "Jan/Feb 2024",
         "https://vtu.ac.in/wp-content/uploads/2024/01/21CV51_Jan2024.pdf", 4, 310,
         "Module 1: General Philosophy of Limit State Design (IS 456-2000) | Module 2: Limit State Design of Beams (Singly & Doubly Reinforced) | Module 3: Limit State Design for Shear, Torsion & Bond | Module 4: Design of One-Way & Two-Way Slabs | Module 5: Design of Short Columns and Isolated Footings"),

        # --- First Year Engineering (Physics & Chemistry Cycles) ---
        ("21MAT11", "Calculus and Linear Algebra", "Basic Science & Humanities", "1st/2nd Sem", "2021/2022 Scheme (VTU NEP)",
         "VTU University Exam Final Paper (Odd Semester 2024)", "PYQ", "Jan/Feb 2024",
         "https://vtu.ac.in/wp-content/uploads/2024/01/21MAT11_Jan2024.pdf", 4, 890,
         "Module 1: Polar Curves & Curvature | Module 2: Partial Differentiation & Jacobians | Module 3: Vector Calculus & Gradient, Divergence, Curl | Module 4: Linear Algebra & Matrix Rank | Module 5: Eigenvalues, Eigenvectors & Diagonalization"),

        ("21PHY12", "Engineering Physics", "Basic Science & Humanities", "1st/2nd Sem", "2021/2022 Scheme (VTU NEP)",
         "VTU Official Model Question Paper with Solution Scheme", "Model Paper", "Model 2024-25",
         "https://vtu.ac.in/wp-content/uploads/2023/11/21PHY12_Model_QP.pdf", 4, 760,
         "Module 1: Quantum Mechanics & Wave Function | Module 2: Lasers & Optical Fibers | Module 3: Dielectric & Magnetic Properties of Materials | Module 4: Superconductivity & Nanomaterials | Module 5: Shock Waves & Modern Acoustics"),

        ("21CHE12", "Engineering Chemistry", "Basic Science & Humanities", "1st/2nd Sem", "2021/2022 Scheme (VTU NEP)",
         "VTU University Exam Final Paper (Odd Semester 2024)", "PYQ", "Jan/Feb 2024",
         "https://vtu.ac.in/wp-content/uploads/2024/01/21CHE12_Jan2024.pdf", 4, 690,
         "Module 1: Electrochemistry & Energy Storage Systems (Li-ion Batteries) | Module 2: Corrosion Science & Metal Finishing | Module 3: Polymer Chemistry & Green Chemistry | Module 4: Instrumental Methods of Analysis | Module 5: Nanotechnology & Sensors"),

        ("21PSP13", "Problem Solving using C & Python Programming", "Basic Science & Humanities", "1st/2nd Sem", "2021/2022 Scheme (VTU NEP)",
         "BIET Departmental Question Bank with Solved Flowcharts & Code", "Question Bank", "Academic Year 2024-25",
         "https://vtu.ac.in/wp-content/uploads/2024/03/21PSP13_QB_2024.pdf", 24, 950,
         "Algorithm design, looping structures, arrays, strings, pointer arithmetic, structures, file handling, and Python data structures.")
    ]

    for p in papers:
        c.execute("""
            INSERT INTO question_banks (
                subject_code, subject_name, department, semester, scheme, title, type, exam_session, file_url, pages_count, downloads_count, module_summary
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, p)

    # 3. Interactive MCQ Question Sets for Practice
    mcqs = [
        # Automata Theory (21CS51)
        ("21CS51", "Automata Theory and Computability", 1,
         "Which of the following formal languages is accepted by a Finite Automata (DFA/NFA)?",
         "Context-Free Languages", "Regular Languages", "Context-Sensitive Languages", "Recursively Enumerable Languages",
         "B", "Finite Automata (both deterministic and non-deterministic) accept exactly the class of Regular Languages (Chomsky Type 3).", "Easy"),

        ("21CS51", "Automata Theory and Computability", 1,
         "If a DFA has n states, what is the maximum number of states in an equivalent minimized DFA?",
         "2^n", "n - 1", "n", "n!",
         "C", "DFA minimization combines indistinguishable states; therefore, the minimized DFA will have at most n states (equal to or fewer than original).", "Medium"),

        ("21CS51", "Automata Theory and Computability", 3,
         "A Pushdown Automaton (PDA) differs from a Finite State Automaton because it possesses which additional component?",
         "Secondary tape", "Infinite stack memory", "Bi-directional read head", "Non-deterministic oracle",
         "B", "A Pushdown Automaton is mathematically equivalent to a Finite State Machine equipped with an auxiliary LIFO stack of infinite storage capacity.", "Easy"),

        ("21CS51", "Automata Theory and Computability", 5,
         "The Halting Problem of a Turing Machine is proven by Alan Turing to be:",
         "Decidable in polynomial time", "Decidable in exponential time", "Undecidable", "Semi-decidable only for DFAs",
         "C", "The Halting Problem is a classic undecidable decision problem; no algorithm can determine whether an arbitrary Turing machine will halt on arbitrary input.", "Medium"),

        # Computer Networks (21CS52)
        ("21CS52", "Computer Networks", 1,
         "Which application layer protocol uses TCP port 53 for zone transfers and UDP port 53 for standard name resolutions?",
         "DHCP", "DNS (Domain Name System)", "SNMP", "BGP",
         "B", "DNS uses UDP port 53 for regular lightweight name resolution queries, and TCP port 53 for reliable zone transfers exceeding 512 bytes.", "Easy"),

        ("21CS52", "Computer Networks", 2,
         "In TCP Congestion Control, what happens immediately when a triple duplicate ACK is received?",
         "Threshold is doubled", "Congestion window resets to 1 MSS", "Fast Retransmit & Fast Recovery triggered; cwnd halved", "Connection is terminated",
         "C", "Upon receiving 3 duplicate ACKs, TCP invokes Fast Retransmit (re-sending the lost segment) and Fast Recovery by halving cwnd + 3 MSS without dropping to 1 MSS.", "Hard"),

        ("21CS52", "Computer Networks", 3,
         "Which routing algorithm avoids routing loops by exchanging full topology state with all routers in the autonomous system?",
         "Distance Vector Routing (RIP)", "Link State Routing (OSPF)", "Border Gateway Protocol (BGP)", "Flooding",
         "B", "OSPF uses Dijkstra's Link-State algorithm where each node maintains an identical global link-state database (LSDB) of the network topology.", "Medium"),

        # Database Management Systems (21CS53)
        ("21CS53", "Database Management Systems", 1,
         "In the Relational Model, a candidate key is defined as a superkey that is:",
         "Composed of foreign attributes", "Minimal (no proper subset is a superkey)", "Assigned null values", "Always numerical",
         "B", "A candidate key is a minimal superkey: a set of attributes that uniquely identifies tuples such that removing any attribute destroys uniqueness.", "Easy"),

        ("21CS53", "Database Management Systems", 3,
         "A relation is in Boyce-Codd Normal Form (BCNF) if and only if for every non-trivial functional dependency X -> Y:",
         "Y is a prime attribute", "X is a superkey", "X is a candidate key and Y is prime", "Y is a subset of X",
         "B", "BCNF is a stricter form of 3NF. For every non-trivial dependency X -> Y, determinant X must be a superkey of the relation.", "Medium"),

        ("21CS53", "Database Management Systems", 4,
         "Which ACID property guarantees that once a transaction commits, its updates persist in the database even in the event of a system crash?",
         "Atomicity", "Consistency", "Isolation", "Durability",
         "D", "Durability ensures that committed transactions survive subsequent hardware failures or system crashes, typically via write-ahead logging (WAL).", "Easy"),

        # Data Structures (21CS32)
        ("21CS32", "Data Structures and Applications", 1,
         "What is the time complexity to evaluate a postfix arithmetic expression of length n using a Stack?",
         "O(1)", "O(log n)", "O(n)", "O(n^2)",
         "C", "Each operand is pushed once and each operator triggers two pops and one push. Total operations are proportional to expression length n, giving O(n).", "Easy"),

        ("21CS32", "Data Structures and Applications", 3,
         "In an AVL Tree, what are the allowed values for the balance factor of any node?",
         "-2, 0, +2", "-1, 0, +1", "0 and 1 only", "Any integer",
         "B", "An AVL tree is a self-balancing binary search tree where the difference between heights of left and right subtrees (balance factor) must be -1, 0, or +1.", "Easy"),

        # Engineering Physics (21PHY12)
        ("21PHY12", "Engineering Physics", 1,
         "The de Broglie wavelength λ associated with a particle having momentum p is given by which fundamental relation?",
         "λ = h / p", "λ = p / h", "λ = h * p", "λ = h * c / p^2",
         "A", "Louis de Broglie formulated that matter exhibits wave properties with wavelength λ = h / p, where h is Planck's constant.", "Easy"),

        ("21PHY12", "Engineering Physics", 2,
         "In an optical fiber, light propagates along the core through the phenomenon of:",
         "Total Internal Reflection", "Diffraction", "Continuous Refraction", "Rayleigh Scattering",
         "A", "Light signals stay confined inside the higher refractive index core (n1 > n2) through repetitive Total Internal Reflection at angles greater than critical angle.", "Easy"),

        # Engineering Mathematics (21MAT11)
        ("21MAT11", "Calculus and Linear Algebra", 4,
         "If matrix A has dimension 3x3 and det(A) = 5, what is det(2A)?",
         "10", "30", "40", "120",
         "C", "For an n x n matrix, det(k*A) = k^n * det(A). Here n=3, k=2, so det(2A) = 2^3 * 5 = 8 * 5 = 40.", "Medium")
    ]

    for m in mcqs:
        c.execute("""
            INSERT INTO mcq_questions (
                subject_code, subject_name, module_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, m)

    conn.commit()
    total_qb = c.execute("SELECT count(*) FROM question_banks").fetchone()[0]
    total_mcq = c.execute("SELECT count(*) FROM mcq_questions").fetchone()[0]
    print(f"✅ Academic Seeding Complete: {total_qb} Question Papers/Banks and {total_mcq} Interactive MCQs populated.")
    conn.close()
    return total_qb, total_mcq

if __name__ == "__main__":
    seed_academic_banks()
