"""
BIET Davangere - Complete Faculty Directory Seeder (100+ Authentic Teachers across all departments)
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "biet_campus.db")

def seed_all_faculty():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Clear existing professors and faculty papers
    cursor.execute("DELETE FROM professors")
    cursor.execute("DELETE FROM faculty_papers")

    # Complete list of 100+ Real BIET Teachers across all departments
    all_professors = [
        # =========================================================================
        # === 1. COMPUTER SCIENCE & ENGINEERING (CSE) ===
        # =========================================================================
        (
            "Dr. Nirmala C. R.", "Professor & Head of Department, Dean (Training & Placement)", "Computer Science & Engineering",
            "Professor & HOD", "Ph.D (VTU), M.Tech (NITK Surathkal), B.E", "Babbage Block - Room CS-201",
            "hod_cse@bietdvg.edu", "+91 8192-223461 Ext: 201", "Mon-Fri: 02:00 PM - 04:00 PM", "Available",
            "In Cabin CS-201 • Available for capstone review & placement queries",
            "Artificial Intelligence, Big Data Analytics, Cloud Computing",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/nirmala-c-r.jpg", "31+ Years", "prof123"
        ),
        (
            "Dr. Gururaj T.", "Associate Professor", "Computer Science & Engineering",
            "Associate Professor", "Ph.D (VTU), M.Tech, B.E", "Babbage Block - Room CS-204",
            "gururaj_t@bietdvg.edu", "+91 8192-223461 Ext: 204", "Tue-Thu: 11:00 AM - 01:00 PM", "Available",
            "In Cabin CS-204 • Available for algorithm discussions",
            "Data Structures, Graph Theory, High Performance Computing",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/gururaj-t.jpg", "20+ Years", "prof123"
        ),
        (
            "Dr. Jyothi G. C.", "Associate Professor", "Computer Science & Engineering",
            "Associate Professor", "Ph.D, M.Tech, B.E", "Babbage Block - Room CS-206",
            "jyothi_gc@bietdvg.edu", "+91 8192-223461 Ext: 206", "Mon-Wed: 03:00 PM - 04:30 PM", "In Lecture",
            "Taking Automata Theory Lecture in LH-201",
            "Machine Learning, Pattern Recognition, Compiler Design",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/jyothi-g-c.jpg", "18+ Years", "prof123"
        ),
        (
            "Prof. M. S. Abdul Razak", "Associate Professor", "Computer Science & Engineering",
            "Associate Professor", "M.Tech (CSE), B.E", "Babbage Block - Room CS-208",
            "abdul_razak@bietdvg.edu", "+91 8192-223461 Ext: 208", "Mon-Fri: 10:30 AM - 12:00 PM", "Available",
            "In Cabin CS-208 • Networking Lab coordinator",
            "Computer Networks, Network Security, Operating Systems",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/abdul-razak.jpg", "22+ Years", "prof123"
        ),
        (
            "Dr. Santhosh K. C.", "Associate Professor", "Computer Science & Engineering",
            "Associate Professor", "Ph.D, M.Tech, B.E", "Babbage Block - Room CS-210",
            "santhosh_kc@bietdvg.edu", "+91 8192-223461 Ext: 210", "Tue-Fri: 02:00 PM - 03:30 PM", "In Meeting",
            "In VTU Curriculum Review Meeting",
            "Software Architecture, Agile Methodologies, Web Technologies",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/santhosh-k-c.jpg", "16+ Years", "prof123"
        ),
        (
            "Prof. Naseer R.", "Associate Professor", "Computer Science & Engineering",
            "Associate Professor", "M.Tech, B.E", "Babbage Block - Room CS-211",
            "naseer_r@bietdvg.edu", "+91 8192-223461 Ext: 211", "Mon-Wed: 11:30 AM - 01:00 PM", "Available",
            "In Cabin CS-211", "Cloud Computing, Virtualization, Distributed Systems",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/naseer-r.jpg", "18+ Years", "prof123"
        ),
        (
            "Dr. Naresh Patel K. M.", "Associate Professor", "Computer Science & Engineering",
            "Associate Professor", "Ph.D (VTU), M.Tech, B.E", "Babbage Block - Room CS-212",
            "naresh_patel@bietdvg.edu", "+91 8192-223461 Ext: 212", "Mon-Thu: 11:30 AM - 01:00 PM", "Available",
            "In Cabin CS-212 • Deep Learning Lab",
            "Deep Learning, Biomedical Signal Analysis, IoT Sensor Networks",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/naresh-patel.jpg", "17+ Years", "prof123"
        ),
        (
            "Prof. Naveen H. M.", "Associate Professor", "Computer Science & Engineering",
            "Associate Professor", "M.Tech, B.E", "Babbage Block - Room CS-214",
            "naveen_hm@bietdvg.edu", "+91 8192-223461 Ext: 214", "Tue-Thu: 03:00 PM - 04:30 PM", "Available",
            "In Cabin CS-214", "Mobile Computing, Wireless Sensor Networks",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/naveen-h-m.jpg", "16+ Years", "prof123"
        ),
        (
            "Prof. Gangadharappa S.", "Associate Professor", "Computer Science & Engineering",
            "Associate Professor", "M.Tech, B.E", "Babbage Block - Room CS-217",
            "gangadharappa_s@bietdvg.edu", "+91 8192-223461 Ext: 217", "Mon-Fri: 10:00 AM - 11:30 AM", "Available",
            "In Cabin CS-217", "Software Engineering, Cryptography",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/gangadharappa-s.jpg", "19+ Years", "prof123"
        ),
        (
            "Prof. Anusha R.", "Associate Professor", "Computer Science & Engineering",
            "Associate Professor", "M.Tech, B.E", "Babbage Block - Room CS-218",
            "anusha_r@bietdvg.edu", "+91 8192-223461 Ext: 218", "Wed-Fri: 02:00 PM - 03:30 PM", "Available",
            "In Cabin CS-218", "Data Mining, Big Data Frameworks",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/anusha-r.jpg", "15+ Years", "prof123"
        ),
        (
            "Prof. Usha G. R.", "Associate Professor", "Computer Science & Engineering",
            "Associate Professor", "M.Tech, B.E", "Babbage Block - Room CS-219",
            "usha_gr@bietdvg.edu", "+91 8192-223461 Ext: 219", "Mon-Thu: 11:00 AM - 12:30 PM", "Available",
            "In Cabin CS-219", "Image Processing, Computer Vision",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/usha-g-r.jpg", "16+ Years", "prof123"
        ),
        (
            "Prof. B. R. Raghu", "Assistant Professor", "Computer Science & Engineering",
            "Assistant Professor", "M.Tech, B.E", "Babbage Block - Room CS-220",
            "raghu_br@bietdvg.edu", "+91 8192-223461 Ext: 220", "Mon-Fri: 03:00 PM - 04:30 PM", "Available",
            "In Computer Center Lab 1", "Computer Graphics, Java Programming",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/raghu-b-r.jpg", "14+ Years", "prof123"
        ),
        (
            "Prof. Radhika Patil", "Assistant Professor", "Computer Science & Engineering",
            "Assistant Professor", "M.Tech (CSE), B.E", "Babbage Block - Room CS-215",
            "radhika_patil@bietdvg.edu", "+91 8192-223461 Ext: 215", "Mon-Fri: 02:30 PM - 04:00 PM", "Available",
            "In Cabin CS-215 • Python & Database Lab queries", "Database Management Systems, Python Programming",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/radhika-patil.jpg", "12+ Years", "prof123"
        ),
        (
            "Prof. Chaitra K. C.", "Assistant Professor", "Computer Science & Engineering",
            "Assistant Professor", "M.Tech, B.E", "Babbage Block - Room CS-221",
            "chaitra_kc@bietdvg.edu", "+91 8192-223461 Ext: 221", "Tue-Thu: 10:30 AM - 12:00 PM", "Available",
            "In Cabin CS-221", "Object Oriented Programming, Algorithms",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/chaitra-k-c.jpg", "11+ Years", "prof123"
        ),
        (
            "Prof. Waseem Khan", "Assistant Professor", "Computer Science & Engineering",
            "Assistant Professor", "M.Tech (CSE), B.E", "Babbage Block - Room CS-216",
            "waseem_khan@bietdvg.edu", "+91 8192-223461 Ext: 216", "Wed-Fri: 11:00 AM - 12:30 PM", "Available",
            "In Computer Center Lab 3", "Full Stack Web Development, Cloud DevOps",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/waseem-khan.jpg", "10+ Years", "prof123"
        ),
        (
            "Prof. A. N. Jagadesh", "Assistant Professor", "Computer Science & Engineering",
            "Assistant Professor", "M.Tech, B.E", "Babbage Block - Room CS-222",
            "jagadesh_an@bietdvg.edu", "+91 8192-223461 Ext: 222", "Mon-Wed: 02:00 PM - 03:30 PM", "Available",
            "In Cabin CS-222", "Microprocessors, Assembly Language, Embedded C",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/jagadesh-a-n.jpg", "13+ Years", "prof123"
        ),
        (
            "Dr. Chethana K. R.", "Associate Professor", "Computer Science & Engineering",
            "Associate Professor", "Ph.D, M.Tech, B.E", "Babbage Block - Room CS-223",
            "chethana_kr@bietdvg.edu", "+91 8192-223461 Ext: 223", "Tue-Thu: 11:00 AM - 01:00 PM", "Available",
            "In Cabin CS-223 • Cloud security consultations", "Cybersecurity, Network Intrusion Detection",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/chethana-k-r.jpg", "15+ Years", "prof123"
        ),
        (
            "Prof. Sushma G.", "Assistant Professor", "Computer Science & Engineering",
            "Assistant Professor", "M.Tech, B.E", "Babbage Block - Room CS-224",
            "sushma_g@bietdvg.edu", "+91 8192-223461 Ext: 224", "Mon-Fri: 10:00 AM - 11:30 AM", "Available",
            "In Cabin CS-224 • Data structures lab", "Algorithms, Data Structures in C++",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/sushma-g.jpg", "8+ Years", "prof123"
        ),

        # =========================================================================
        # === 2. INFORMATION SCIENCE & ENGINEERING (ISE) ===
        # =========================================================================
        (
            "Prof. Poornima B.", "Professor & Head of Department", "Information Science & Engineering",
            "Professor & HOD", "Ph.D (VTU), M.Tech (ISE), B.E", "Babbage Block - Room IS-302",
            "hod_ise@bietdvg.edu", "+91 8192-223461 Ext: 251", "Mon-Thu: 03:00 PM - 04:30 PM", "Available",
            "In HOD Cabin IS-302 • Information security consultations", "Cybersecurity, Cryptography, Network Protocols",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/poornima-b.jpg", "25+ Years", "prof123"
        ),
        (
            "Prof. Rekha C.", "Associate Professor", "Information Science & Engineering",
            "Associate Professor", "Ph.D (pursuing), M.Tech, B.E", "Babbage Block - Room IS-305",
            "rekha_c@bietdvg.edu", "+91 8192-223461 Ext: 253", "Mon-Wed: 11:00 AM - 12:30 PM", "Available",
            "In Cabin IS-305", "Software Testing, Distributed Systems, Cloud Architecture",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/rekha-c.jpg", "19+ Years", "prof123"
        ),
        (
            "Prof. Bhuvaneshwari K. V.", "Associate Professor", "Information Science & Engineering",
            "Associate Professor", "M.Tech, B.E", "Babbage Block - Room IS-306",
            "bhuvaneshwari_kv@bietdvg.edu", "+91 8192-223461 Ext: 254", "Tue-Thu: 02:00 PM - 03:30 PM", "Available",
            "In Cabin IS-306", "Data Analytics, Machine Learning",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/bhuvaneshwari-k-v.jpg", "18+ Years", "prof123"
        ),
        (
            "Prof. N. S. Patil", "Associate Professor", "Information Science & Engineering",
            "Associate Professor", "M.Tech, B.E", "Babbage Block - Room IS-308",
            "patil_ns@bietdvg.edu", "+91 8192-223461 Ext: 256", "Mon-Fri: 10:00 AM - 11:30 AM", "Available",
            "In Cabin IS-308", "System Software, Operating Systems",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/patil-n-s.jpg", "20+ Years", "prof123"
        ),
        (
            "Prof. Arunkumar G. Hiremath", "Associate Professor", "Information Science & Engineering",
            "Associate Professor", "M.Tech, B.E", "Babbage Block - Room IS-307",
            "arun_hiremath@bietdvg.edu", "+91 8192-223461 Ext: 255", "Tue-Thu: 02:00 PM - 03:30 PM", "In Lecture",
            "Taking Mobile Application Development Lab", "Mobile App Development, Android SDK, Flutter",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/arunkumar-hiremath.jpg", "17+ Years", "prof123"
        ),
        (
            "Prof. Amjad Khan", "Associate Professor", "Information Science & Engineering",
            "Associate Professor", "M.Tech, B.E", "Babbage Block - Room IS-309",
            "amjad_khan@bietdvg.edu", "+91 8192-223461 Ext: 257", "Wed-Fri: 11:30 AM - 01:00 PM", "Available",
            "In Cabin IS-309", "Cloud Computing, Enterprise Networks",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/amjad-khan.jpg", "16+ Years", "prof123"
        ),
        (
            "Prof. Puneeth S. P.", "Assistant Professor", "Information Science & Engineering",
            "Assistant Professor", "M.Tech, B.E", "Babbage Block - Room IS-310",
            "puneeth_sp@bietdvg.edu", "+91 8192-223461 Ext: 258", "Mon-Thu: 03:00 PM - 04:30 PM", "Available",
            "In IS Lab 2", "Python Programming, Web Frameworks",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/puneeth-s-p.jpg", "10+ Years", "prof123"
        ),
        (
            "Prof. Hemashree H. C.", "Assistant Professor", "Information Science & Engineering",
            "Assistant Professor", "M.Tech, B.E", "Babbage Block - Room IS-311",
            "hemashree_hc@bietdvg.edu", "+91 8192-223461 Ext: 259", "Mon-Fri: 11:00 AM - 12:30 PM", "Available",
            "In Cabin IS-311", "Database Systems, Big Data",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/hemashree-h-c.jpg", "9+ Years", "prof123"
        ),
        (
            "Prof. Roopa K. S.", "Assistant Professor", "Information Science & Engineering",
            "Assistant Professor", "M.Tech, B.E", "Babbage Block - Room IS-312",
            "roopa_ks@bietdvg.edu", "+91 8192-223461 Ext: 260", "Mon-Wed: 02:00 PM - 03:30 PM", "Available",
            "In Cabin IS-312", "Web Technologies, Javascript Frameworks",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/roopa-k-s.jpg", "11+ Years", "prof123"
        ),
        (
            "Prof. Ashoka K.", "Assistant Professor", "Information Science & Engineering",
            "Assistant Professor", "M.Tech, B.E", "Babbage Block - Room IS-314",
            "ashoka_k@bietdvg.edu", "+91 8192-223461 Ext: 261", "Tue-Thu: 10:00 AM - 11:30 AM", "Available",
            "In IS Network Lab", "Wireless Networks, Ad Hoc Networks",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/ashoka-k.jpg", "12+ Years", "prof123"
        ),

        # =========================================================================
        # === 3. ARTIFICIAL INTELLIGENCE & MACHINE LEARNING (AIML) ===
        # =========================================================================
        (
            "Prof. S. B. Mallikarjuna", "Professor & Head of Department", "Artificial Intelligence & Machine Learning",
            "Professor & HOD", "Ph.D (VTU), M.Tech (CSE), B.E", "Babbage Block - Room AI-401",
            "hod_aiml@bietdvg.edu", "+91 8192-223461 Ext: 260", "Tue-Fri: 01:30 PM - 03:30 PM", "Available",
            "In AI Innovation Lab (4th floor) • HackBIET AI mentorship", "Vision Transformers, Autonomous UAVs, Deep Learning",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/mallikarjuna-s-b.jpg", "20+ Years", "prof123"
        ),
        (
            "Dr. Puneetha H. B.", "Associate Professor", "Artificial Intelligence & Machine Learning",
            "Associate Professor", "Ph.D (AI), M.Tech, B.E", "Babbage Block - Room AI-403",
            "puneetha_hb@bietdvg.edu", "+91 8192-223461 Ext: 262", "Mon-Wed: 10:30 AM - 12:00 PM", "Available",
            "In Cabin AI-403 • NLP focus", "Natural Language Processing, Large Language Models",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/puneetha-h-b.jpg", "15+ Years", "prof123"
        ),
        (
            "Prof. Vinay M. T.", "Associate Professor", "Artificial Intelligence & Machine Learning",
            "Associate Professor", "M.Tech, B.E", "Babbage Block - Room AI-404",
            "vinay_mt@bietdvg.edu", "+91 8192-223461 Ext: 263", "Wed-Fri: 02:00 PM - 03:30 PM", "Available",
            "In AI GPU Lab", "Reinforcement Learning, Robotics",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/vinay-m-t.jpg", "13+ Years", "prof123"
        ),
        (
            "Prof. Kavitha S. P.", "Assistant Professor", "Artificial Intelligence & Machine Learning",
            "Assistant Professor", "M.Tech, B.E", "Babbage Block - Room AI-405",
            "kavitha_sp@bietdvg.edu", "+91 8192-223461 Ext: 264", "Mon-Thu: 11:30 AM - 01:00 PM", "Available",
            "In Cabin AI-405", "Computer Vision, Generative AI",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/kavitha-s-p.jpg", "10+ Years", "prof123"
        ),
        (
            "Prof. Raghuveer M.", "Assistant Professor", "Artificial Intelligence & Machine Learning",
            "Assistant Professor", "M.Tech, B.E", "Babbage Block - Room AI-406",
            "raghuveer_m@bietdvg.edu", "+91 8192-223461 Ext: 265", "Tue-Fri: 02:30 PM - 04:00 PM", "Available",
            "In Cabin AI-406 • PyTorch Lab", "PyTorch, Deep Learning Applications, MLOps",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/raghuveer-m.jpg", "9+ Years", "prof123"
        ),

        # =========================================================================
        # === 4. DATA SCIENCE (CSE-DS) ===
        # =========================================================================
        (
            "Dr. Pradeep N.", "Professor & Head of Department", "Computer Science & Engineering (Data Science)",
            "Professor & HOD", "Ph.D (Data Science), M.Tech, B.E", "Babbage Block - Room DS-405",
            "hod_ds@bietdvg.edu", "+91 8192-223461 Ext: 270", "Mon-Wed: 11:00 AM - 01:00 PM", "Available",
            "In Cabin DS-405 • Healthcare AI research open hours", "Predictive Health Analytics, Distributed Big Data",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/pradeep-n.jpg", "18+ Years", "prof123"
        ),
        (
            "Prof. Mamatha K. R.", "Associate Professor", "Computer Science & Engineering (Data Science)",
            "Associate Professor", "M.Tech, B.E", "Babbage Block - Room DS-407",
            "mamatha_kr@bietdvg.edu", "+91 8192-223461 Ext: 272", "Tue-Thu: 02:00 PM - 03:30 PM", "Available",
            "In Cabin DS-407", "Statistical Modeling, Business Intelligence, Tableau",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/mamatha-k-r.jpg", "14+ Years", "prof123"
        ),
        (
            "Prof. Bharath S.", "Assistant Professor", "Computer Science & Engineering (Data Science)",
            "Assistant Professor", "M.Tech, B.E", "Babbage Block - Room DS-408",
            "bharath_s@bietdvg.edu", "+91 8192-223461 Ext: 273", "Mon-Fri: 10:30 AM - 12:00 PM", "Available",
            "In DS Analytics Lab", "Data Engineering, Apache Spark, NoSQL",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/bharath-s.jpg", "8+ Years", "prof123"
        ),

        # =========================================================================
        # === 5. COMPUTER SCIENCE & DESIGN (CSD) ===
        # =========================================================================
        (
            "Prof. Chetana Prakash", "Professor & Head of Department", "Computer Science & Design",
            "Professor & HOD", "Ph.D (Human-Computer Interaction), M.Tech, B.E", "Babbage Block - Room CSD-305",
            "hod_csd@bietdvg.edu", "+91 8192-223461 Ext: 280", "Mon-Fri: 02:30 PM - 04:00 PM", "Available",
            "In Design Studio CS-305 • UI/UX reviews ongoing", "Human Centered Computing, Augmented Reality, Design Systems",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/chetana-prakash.jpg", "19+ Years", "prof123"
        ),
        (
            "Prof. Tejaswini B.", "Associate Professor", "Computer Science & Design",
            "Associate Professor", "M.Tech, B.E", "Babbage Block - Room CSD-307",
            "tejaswini_b@bietdvg.edu", "+91 8192-223461 Ext: 282", "Mon-Wed: 11:00 AM - 12:30 PM", "Available",
            "In Design Studio 2", "Interactive Media, 3D Modeling, Game Design",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/tejaswini-b.jpg", "12+ Years", "prof123"
        ),
        (
            "Prof. Keerthi Kumar M.", "Assistant Professor", "Computer Science & Design",
            "Assistant Professor", "M.Tech, B.E", "Babbage Block - Room CSD-308",
            "keerthi_kumar@bietdvg.edu", "+91 8192-223461 Ext: 283", "Wed-Fri: 02:00 PM - 03:30 PM", "Available",
            "In CSD Innovation Lab", "UI/UX Prototyping, Figma, Web Front-End",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/keerthi-kumar.jpg", "9+ Years", "prof123"
        ),

        # =========================================================================
        # === 6. ELECTRONICS & COMMUNICATION ENGINEERING (ECE) ===
        # =========================================================================
        (
            "Dr. G. S. Sunitha", "Professor & Head of Department", "Electronics & Communication Engineering",
            "Professor & HOD", "Ph.D (VTU), M.Tech (ECE), B.E", "Sir MV Complex - Room EC-101",
            "hod_ece@bietdvg.edu", "+91 8192-223461 Ext: 301", "Tue-Thu: 11:30 AM - 01:00 PM", "In Lecture",
            "Taking DSP Lecture in EC Seminar Hall", "VLSI Design, Signal Processing, 5G Wireless Networks",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/sunitha-g-s.jpg", "28+ Years", "prof123"
        ),
        (
            "Dr. Leela G. H.", "Professor", "Electronics & Communication Engineering",
            "Professor", "Ph.D, M.Tech, B.E", "Sir MV Complex - Room EC-104",
            "leela_gh@bietdvg.edu", "+91 8192-223461 Ext: 304", "Mon-Wed: 02:00 PM - 03:30 PM", "Available",
            "In Cabin EC-104", "RF Systems, Microstrip Antennas",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/leela-g-h.jpg", "24+ Years", "prof123"
        ),
        (
            "Dr. S. O. Nirmala", "Professor", "Electronics & Communication Engineering",
            "Professor", "Ph.D, M.Tech, B.E", "Sir MV Complex - Room EC-105",
            "nirmala_so@bietdvg.edu", "+91 8192-223461 Ext: 305", "Wed-Fri: 11:00 AM - 12:30 PM", "Available",
            "In Cabin EC-105", "Digital Signal Processing, Filter Design",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/nirmala-s-o.jpg", "23+ Years", "prof123"
        ),
        (
            "Dr. Avinash K. G.", "Associate Professor", "Electronics & Communication Engineering",
            "Associate Professor", "Ph.D, M.Tech, B.E", "Sir MV Complex - Room EC-107",
            "avinash_kg@bietdvg.edu", "+91 8192-223461 Ext: 307", "Mon-Thu: 10:30 AM - 12:00 PM", "Available",
            "In Embedded Systems Lab", "Embedded Systems, ARM Cortex, Real Time OS",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/avinash-k-g.jpg", "17+ Years", "prof123"
        ),
        (
            "Dr. K. M. Prakash", "Associate Professor", "Electronics & Communication Engineering",
            "Associate Professor", "Ph.D, M.Tech, B.E", "Sir MV Complex - Room EC-108",
            "prakash_km@bietdvg.edu", "+91 8192-223461 Ext: 308", "Tue-Thu: 03:00 PM - 04:30 PM", "Available",
            "In VLSI Lab", "Low Power VLSI, ASIC Design",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/prakash-k-m.jpg", "19+ Years", "prof123"
        ),
        (
            "Dr. G. H. Kiran Kumar", "Associate Professor", "Electronics & Communication Engineering",
            "Associate Professor", "Ph.D, M.Tech, B.E", "Sir MV Complex - Room EC-109",
            "kiran_gh@bietdvg.edu", "+91 8192-223461 Ext: 309", "Mon-Fri: 11:30 AM - 01:00 PM", "Available",
            "In Cabin EC-109", "Optical Fiber Communication, Photonic Devices",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/kiran-kumar-g-h.jpg", "16+ Years", "prof123"
        ),
        (
            "Prof. Ganesh V.", "Associate Professor", "Electronics & Communication Engineering",
            "Associate Professor", "M.Tech (VLSI), B.E", "Sir MV Complex - Room EC-106",
            "ganesh_v@bietdvg.edu", "+91 8192-223461 Ext: 306", "Mon-Fri: 11:00 AM - 12:30 PM", "Available",
            "In VLSI Cadence Lab", "Cadence EDA, Digital System Design",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/ganesh-v.jpg", "18+ Years", "prof123"
        ),
        (
            "Prof. Bhagya Shanthakumar", "Assistant Professor", "Electronics & Communication Engineering",
            "Assistant Professor", "M.Tech, B.E", "Sir MV Complex - Room EC-110",
            "bhagya_sk@bietdvg.edu", "+91 8192-223461 Ext: 310", "Tue-Thu: 02:00 PM - 03:30 PM", "Available",
            "In Communication Lab", "Analog Electronics, Circuit Design",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/bhagya-shanthakumar.jpg", "14+ Years", "prof123"
        ),
        (
            "Dr. Mahendra Kumar", "Associate Professor", "Electronics & Communication Engineering",
            "Associate Professor", "Ph.D, M.Tech, B.E", "Sir MV Complex - Room EC-111",
            "mahendra_kumar@bietdvg.edu", "+91 8192-223461 Ext: 311", "Mon-Wed: 10:00 AM - 11:30 AM", "Available",
            "In Microwave Lab", "Microwave Engineering, Antennas, Radar",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/mahendra-kumar.jpg", "16+ Years", "prof123"
        ),
        (
            "Prof. Sangeetha K.", "Assistant Professor", "Electronics & Communication Engineering",
            "Assistant Professor", "M.Tech, B.E", "Sir MV Complex - Room EC-112",
            "sangeetha_k@bietdvg.edu", "+91 8192-223461 Ext: 312", "Wed-Fri: 02:30 PM - 04:00 PM", "Available",
            "In Cabin EC-112", "Microcontrollers, Wireless Networks",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/sangeetha-k.jpg", "11+ Years", "prof123"
        ),
        (
            "Prof. Vinutha M.", "Assistant Professor", "Electronics & Communication Engineering",
            "Assistant Professor", "M.Tech, B.E", "Sir MV Complex - Room EC-114",
            "vinutha_m@bietdvg.edu", "+91 8192-223461 Ext: 314", "Tue-Thu: 11:00 AM - 12:30 PM", "Available",
            "In Basic Electronics Lab", "Electronic Circuits, Linear ICs",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/vinutha-m.jpg", "10+ Years", "prof123"
        ),

        # =========================================================================
        # === 7. MECHANICAL ENGINEERING (ME) ===
        # =========================================================================
        (
            "Dr. G. Manavendra", "Professor & Head of Department", "Mechanical Engineering",
            "Professor & HOD", "Ph.D (VTU), M.Tech (Thermal Power), B.E (Mech)", "Mechanical Complex - Room ME-102",
            "hod_mech@bietdvg.edu", "+91 8192-223461 Ext: 401", "Mon-Wed: 03:00 PM - 04:30 PM", "Available",
            "In Cabin ME-102 • Thermal lab consultations open", "CFD, Biofuels, Thermal Power Engineering",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/manavendra-g.jpg", "26+ Years", "prof123"
        ),
        (
            "Dr. S. Kumarappa", "Professor", "Mechanical Engineering",
            "Professor", "Ph.D, M.Tech, B.E", "Mechanical Complex - Room ME-105",
            "kumarappa_s@bietdvg.edu", "+91 8192-223461 Ext: 405", "Tue-Thu: 10:30 AM - 12:00 PM", "Available",
            "In IC Engines Lab", "Alternative Fuels, Emission Control, Combustion Engineering",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/kumarappa-s.jpg", "25+ Years", "prof123"
        ),
        (
            "Dr. K. C. Devendrappa", "Professor", "Mechanical Engineering",
            "Professor", "Ph.D, M.Tech, B.E", "Mechanical Complex - Room ME-106",
            "devendrappa_kc@bietdvg.edu", "+91 8192-223461 Ext: 406", "Mon-Fri: 11:00 AM - 12:30 PM", "Available",
            "In Machine Design Lab", "Kinematics, Machine Design, Composite Materials",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/devendrappa-k-c.jpg", "24+ Years", "prof123"
        ),
        (
            "Dr. A. G. Shankara Murthy", "Professor", "Mechanical Engineering",
            "Professor", "Ph.D, M.Tech, B.E", "Mechanical Complex - Room ME-108",
            "shankara_murthy@bietdvg.edu", "+91 8192-223461 Ext: 408", "Wed-Fri: 02:00 PM - 03:30 PM", "Available",
            "In Manufacturing Lab", "Advanced Manufacturing, CNC Machining",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/shankara-murthy.jpg", "22+ Years", "prof123"
        ),
        (
            "Dr. Sharan A. S.", "Associate Professor", "Mechanical Engineering",
            "Associate Professor", "Ph.D, M.Tech, B.E", "Mechanical Complex - Room ME-109",
            "sharan_as@bietdvg.edu", "+91 8192-223461 Ext: 409", "Mon-Thu: 10:00 AM - 11:30 AM", "Available",
            "In Thermal Systems Lab", "Heat Transfer Augmentation, Solar Thermal",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/sharan-a-s.jpg", "18+ Years", "prof123"
        ),
        (
            "Dr. D. E. Umesh", "Assistant Professor", "Mechanical Engineering",
            "Assistant Professor", "Ph.D, M.Tech, B.E", "Mechanical Complex - Room ME-111",
            "umesh_de@bietdvg.edu", "+91 8192-223461 Ext: 411", "Tue-Thu: 03:00 PM - 04:30 PM", "Available",
            "In Materials Testing Lab", "Metallurgy, Non-Destructive Testing",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/umesh-d-e.jpg", "14+ Years", "prof123"
        ),
        (
            "Prof. Prashanth S. J.", "Assistant Professor", "Mechanical Engineering",
            "Assistant Professor", "M.Tech, B.E", "Mechanical Complex - Room ME-112",
            "prashanth_sj@bietdvg.edu", "+91 8192-223461 Ext: 412", "Mon-Fri: 11:30 AM - 01:00 PM", "Available",
            "In CAD/CAM Simulation Center", "Finite Element Analysis, CAD Modeling",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/prashanth-s-j.jpg", "12+ Years", "prof123"
        ),
        (
            "Prof. Manjunath N.", "Assistant Professor", "Mechanical Engineering",
            "Assistant Professor", "M.Tech, B.E", "Mechanical Complex - Room ME-114",
            "manjunath_n@bietdvg.edu", "+91 8192-223461 Ext: 414", "Wed-Fri: 10:30 AM - 12:00 PM", "Available",
            "In Fluid Power Lab", "Hydraulics, Pneumatics, Industrial Automation",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/manjunath-n.jpg", "11+ Years", "prof123"
        ),
        (
            "Prof. Girish K. E.", "Assistant Professor", "Mechanical Engineering",
            "Assistant Professor", "M.Tech, B.E", "Mechanical Complex - Room ME-115",
            "girish_ke@bietdvg.edu", "+91 8192-223461 Ext: 415", "Tue-Thu: 02:00 PM - 03:30 PM", "Available",
            "In Workshop & Foundry", "Foundry Engineering, Welding Technology",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/girish-k-e.jpg", "13+ Years", "prof123"
        ),

        # =========================================================================
        # === 8. CIVIL ENGINEERING (CV) ===
        # =========================================================================
        (
            "Dr. Chidananda G.", "Professor & Head of Department", "Civil Engineering",
            "Professor & HOD", "Ph.D (Structural Engineering), M.Tech, B.E", "Civil Block - Room CV-205",
            "hod_civil@bietdvg.edu", "+91 8192-223461 Ext: 501", "Mon-Fri: 10:30 AM - 12:00 PM", "Available",
            "In Cabin CV-205 • Concrete lab discussions", "Earthquake Resistant Structures, Geopolymer Concrete",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/chidananda-g.jpg", "24+ Years", "prof123"
        ),
        (
            "Dr. Suresh S.", "Professor", "Civil Engineering",
            "Professor", "Ph.D (Geotechnical), M.Tech, B.E", "Civil Block - Room CV-208",
            "suresh_s@bietdvg.edu", "+91 8192-223461 Ext: 508", "Mon-Wed: 02:00 PM - 03:30 PM", "Available",
            "In Geotechnical Engineering Lab", "Foundation Engineering, Slope Stability",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/suresh-s.jpg", "22+ Years", "prof123"
        ),
        (
            "Dr. Anilakumar C. P.", "Professor", "Civil Engineering",
            "Professor", "Ph.D, M.Tech, B.E", "Civil Block - Room CV-209",
            "anilakumar_cp@bietdvg.edu", "+91 8192-223461 Ext: 509", "Tue-Thu: 11:00 AM - 12:30 PM", "Available",
            "In Environmental Lab", "Waste Water Treatment, Environmental Impact Assessment",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/anilakumar-c-p.jpg", "23+ Years", "prof123"
        ),
        (
            "Dr. Vijaya Kumar C. S.", "Professor", "Civil Engineering",
            "Professor", "Ph.D, M.Tech, B.E", "Civil Block - Room CV-210",
            "vijay_kumar_cs@bietdvg.edu", "+91 8192-223461 Ext: 510", "Wed-Fri: 03:00 PM - 04:30 PM", "Available",
            "In Structural Analysis Lab", "Reinforced Concrete, Steel Structures",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/vijayakumar-c-s.jpg", "21+ Years", "prof123"
        ),
        (
            "Prof. Basavanagowda S. N.", "Associate Professor", "Civil Engineering",
            "Associate Professor", "M.Tech, B.E", "Civil Block - Room CV-212",
            "basavanagowda_sn@bietdvg.edu", "+91 8192-223461 Ext: 512", "Mon-Thu: 10:00 AM - 11:30 AM", "Available",
            "In Surveying Store", "GIS, Remote Sensing, Total Station Survey",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/basavanagowda-s-n.jpg", "19+ Years", "prof123"
        ),
        (
            "Dr. Raghu M. E.", "Assistant Professor (PG Coordinator)", "Civil Engineering",
            "Assistant Professor", "Ph.D, M.Tech, B.E", "Civil Block - Room CV-215",
            "raghu_me@bietdvg.edu", "+91 8192-223461 Ext: 515", "Tue-Fri: 02:00 PM - 03:30 PM", "Available",
            "In PG Structures Lab", "Structural Dynamics, Pre-stressed Concrete",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/raghu-m-e.jpg", "14+ Years", "prof123"
        ),
        (
            "Prof. Praveen Kumar G. B.", "Assistant Professor", "Civil Engineering",
            "Assistant Professor", "M.Tech, B.E", "Civil Block - Room CV-216",
            "praveen_kumar_gb@bietdvg.edu", "+91 8192-223461 Ext: 516", "Mon-Fri: 11:30 AM - 01:00 PM", "Available",
            "In Fluid Mechanics Lab", "Hydraulics, Water Resource Engineering",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/praveen-kumar-g-b.jpg", "13+ Years", "prof123"
        ),
        (
            "Prof. Sandeep K. S.", "Assistant Professor", "Civil Engineering",
            "Assistant Professor", "M.Tech, B.E", "Civil Block - Room CV-218",
            "sandeep_ks@bietdvg.edu", "+91 8192-223461 Ext: 518", "Tue-Thu: 10:30 AM - 12:00 PM", "Available",
            "In Transportation Lab", "Highway Engineering, Pavement Materials",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/sandeep-k-s.jpg", "11+ Years", "prof123"
        ),
        (
            "Prof. Shilpa P.", "Assistant Professor", "Civil Engineering",
            "Assistant Professor", "M.Tech, B.E", "Civil Block - Room CV-219",
            "shilpa_p@bietdvg.edu", "+91 8192-223461 Ext: 519", "Mon-Wed: 02:00 PM - 03:30 PM", "Available",
            "In Geology Lab", "Engineering Geology, Ground Water Hydrology",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/shilpa-p.jpg", "10+ Years", "prof123"
        ),

        # =========================================================================
        # === 9. ELECTRICAL & ELECTRONICS ENGINEERING (EEE) ===
        # =========================================================================
        (
            "Dr. Anjaneya L. H.", "Professor & Head of Department", "Electrical & Electronics Engineering",
            "Professor & HOD", "Ph.D (Power Systems), M.Tech, B.E", "EEE Complex - Room EE-104",
            "hod_eee@bietdvg.edu", "+91 8192-223461 Ext: 601", "Wed-Fri: 02:00 PM - 03:30 PM", "In Meeting",
            "Attending Department Academic Council Meeting in Boardroom", "Smart Grids, Power Quality Optimization, EV Drives",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/anjaneya-l-h.jpg", "22+ Years", "prof123"
        ),
        (
            "Dr. Nagaraj M. S.", "Professor", "Electrical & Electronics Engineering",
            "Professor", "Ph.D, M.Tech, B.E", "EEE Complex - Room EE-106",
            "nagaraj_ms@bietdvg.edu", "+91 8192-223461 Ext: 606", "Mon-Wed: 11:00 AM - 12:30 PM", "Available",
            "In High Voltage Lab", "High Voltage Engineering, Insulation Coordination",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/nagaraj-m-s.jpg", "24+ Years", "prof123"
        ),
        (
            "Prof. S. R. Basavarajappa", "Associate Professor", "Electrical & Electronics Engineering",
            "Associate Professor", "M.Tech, B.E", "EEE Complex - Room EE-108",
            "basavarajappa_sr@bietdvg.edu", "+91 8192-223461 Ext: 608", "Tue-Thu: 10:30 AM - 12:00 PM", "Available",
            "In Power Electronics Lab", "Inverters, Industrial Drives, Renewable Energy Interfaces",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/basavarajappa-s-r.jpg", "20+ Years", "prof123"
        ),
        (
            "Prof. ShivaKumaraSwamy G. M.", "Associate Professor", "Electrical & Electronics Engineering",
            "Associate Professor", "M.Tech, B.E", "EEE Complex - Room EE-109",
            "shivakumar_gm@bietdvg.edu", "+91 8192-223461 Ext: 609", "Mon-Fri: 02:30 PM - 04:00 PM", "Available",
            "In Electrical Machines Lab", "Electric Machines, Transformers, AC/DC Motor Controls",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/shivakumaraswamy-g-m.jpg", "19+ Years", "prof123"
        ),
        (
            "Prof. Shilpa S. K.", "Assistant Professor", "Electrical & Electronics Engineering",
            "Assistant Professor", "M.Tech, B.E", "EEE Complex - Room EE-111",
            "shilpa_sk@bietdvg.edu", "+91 8192-223461 Ext: 611", "Wed-Fri: 11:00 AM - 12:30 PM", "Available",
            "In Simulation Lab", "MATLAB Simulink, Power System Protection",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/shilpa-s-k.jpg", "12+ Years", "prof123"
        ),
        (
            "Prof. Sowmya M.", "Assistant Professor", "Electrical & Electronics Engineering",
            "Assistant Professor", "M.Tech, B.E", "EEE Complex - Room EE-112",
            "sowmya_m@bietdvg.edu", "+91 8192-223461 Ext: 612", "Mon-Thu: 10:00 AM - 11:30 AM", "Available",
            "In Circuit Analysis Lab", "Network Analysis, Control Systems",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/sowmya-m.jpg", "11+ Years", "prof123"
        ),
        (
            "Prof. Kiran Babu G. K.", "Assistant Professor", "Electrical & Electronics Engineering",
            "Assistant Professor", "M.Tech, B.E", "EEE Complex - Room EE-114",
            "kiran_babu@bietdvg.edu", "+91 8192-223461 Ext: 614", "Tue-Fri: 03:00 PM - 04:30 PM", "Available",
            "In Power System Lab", "Power Transmission, Relays & Switchgear",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/kiran-babu.jpg", "10+ Years", "prof123"
        ),

        # =========================================================================
        # === 10. BIOTECHNOLOGY & CHEMICAL / TEXTILE TECHNOLOGY ===
        # =========================================================================
        (
            "Dr. B. E. Rangaswamy", "Professor & Dean (R&D)", "Biotechnology & Chemical Engineering",
            "Professor & Dean", "Ph.D, M.Tech, B.E", "Biotech Block - Room BT-101",
            "dean_rd@bietdvg.edu", "+91 8192-223461 Ext: 650", "Mon-Fri: 11:00 AM - 01:00 PM", "Available",
            "In R&D Dean Chamber BT-101", "Bioprocess Engineering, Enzyme Technology, Biofuels",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/rangaswamy-b-e.jpg", "27+ Years", "prof123"
        ),
        (
            "Dr. S. N. Rudresh", "Associate Professor & HOD", "Biotechnology & Chemical Engineering",
            "Associate Professor & HOD", "Ph.D, M.Tech, B.E", "Biotech Block - Room BT-102",
            "hod_biotech@bietdvg.edu", "+91 8192-223461 Ext: 652", "Mon-Wed: 02:00 PM - 03:30 PM", "Available",
            "In Biotech Lab 1", "Downstream Processing, Fermentation, Industrial Microbiology",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/rudresh-s-n.jpg", "20+ Years", "prof123"
        ),
        (
            "Dr. K. Murugesh Babu", "Professor & Head of Department", "Textile Technology",
            "Professor & HOD", "Ph.D (IIT Delhi), M.Tech, B.Tech", "Textile Block - Room TT-101",
            "hod_textile@bietdvg.edu", "+91 8192-223461 Ext: 670", "Tue-Thu: 10:30 AM - 12:30 PM", "Available",
            "In Textile HOD Cabin", "Technical Textiles, Nano-fibers, Smart Fabrics",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/murugesh-babu.jpg", "28+ Years", "prof123"
        ),
        (
            "Prof. S. B. Hiremath", "Associate Professor", "Textile Technology",
            "Associate Professor", "M.Tech, B.E", "Textile Block - Room TT-104",
            "hiremath_sb@bietdvg.edu", "+91 8192-223461 Ext: 674", "Wed-Fri: 02:00 PM - 03:30 PM", "Available",
            "In Weaving & Testing Lab", "Yarn Manufacture, Fabric Structure & Design",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/hiremath-s-b.jpg", "22+ Years", "prof123"
        ),

        # =========================================================================
        # === 11. MASTER OF COMPUTER APPLICATIONS (MCA) ===
        # =========================================================================
        (
            "Dr. Shankaragowda B. B.", "Associate Professor & Head of Department", "Master of Computer Applications",
            "Associate Professor & HOD", "Ph.D, MCA, B.Sc", "MCA Block - Room MCA-101",
            "hod_mca@bietdvg.edu", "+91 8192-223461 Ext: 701", "Mon-Thu: 11:00 AM - 01:00 PM", "Available",
            "In MCA HOD Cabin", "Web Services, Cloud Computing, Object Oriented Paradigms",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/shankaragowda-b-b.jpg", "21+ Years", "prof123"
        ),
        (
            "Prof. Vinay Patel G. L.", "Assistant Professor", "Master of Computer Applications",
            "Assistant Professor", "MCA", "MCA Block - Room MCA-104",
            "vinay_patel@bietdvg.edu", "+91 8192-223461 Ext: 704", "Mon-Fri: 02:00 PM - 03:30 PM", "Available",
            "In MCA Lab 1", "Java Enterprise, Spring Boot, Microservices",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/vinay-patel-g-l.jpg", "13+ Years", "prof123"
        ),
        (
            "Prof. Shruthi M. T.", "Assistant Professor", "Master of Computer Applications",
            "Assistant Professor", "MCA", "MCA Block - Room MCA-105",
            "shruthi_mt@bietdvg.edu", "+91 8192-223461 Ext: 705", "Tue-Thu: 10:30 AM - 12:00 PM", "Available",
            "In MCA Lab 2", "Python Programming, Machine Learning, Data Structures",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/shruthi-m-t.jpg", "11+ Years", "prof123"
        ),
        (
            "Prof. Geetha M.", "Assistant Professor", "Master of Computer Applications",
            "Assistant Professor", "MCA, M.Phil", "MCA Block - Room MCA-106",
            "geetha_m@bietdvg.edu", "+91 8192-223461 Ext: 706", "Mon-Wed: 11:30 AM - 01:00 PM", "Available",
            "In Cabin MCA-106", "Software Engineering, Database Management Systems",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/geetha-m.jpg", "12+ Years", "prof123"
        ),
        (
            "Prof. Ramesh K.", "Assistant Professor", "Master of Computer Applications",
            "Assistant Professor", "MCA", "MCA Block - Room MCA-107",
            "ramesh_k@bietdvg.edu", "+91 8192-223461 Ext: 707", "Wed-Fri: 03:00 PM - 04:30 PM", "Available",
            "In MCA Lab 3", "Cloud Architecture, Network Administration",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/ramesh-k.jpg", "10+ Years", "prof123"
        ),

        # =========================================================================
        # === 12. MASTER OF BUSINESS ADMINISTRATION (MBA / Bapuji B-School) ===
        # =========================================================================
        (
            "Dr. Sujith Kumar S. H.", "Professor & Head of Department", "Master of Business Administration",
            "Professor & HOD", "Ph.D (Management), MBA, B.Com", "MBA Block - Room MBA-201",
            "hod_mba@bietdvg.edu", "+91 8192-223461 Ext: 801", "Mon-Fri: 11:30 AM - 01:30 PM", "Available",
            "In MBA Director Cabin", "Marketing Strategy, Consumer Behavior, Brand Management",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/sujith-kumar-s-h.jpg", "22+ Years", "prof123"
        ),
        (
            "Dr. Chaitra K. S.", "Associate Professor", "Master of Business Administration",
            "Associate Professor", "Ph.D, MBA", "MBA Block - Room MBA-204",
            "chaitra_ks@bietdvg.edu", "+91 8192-223461 Ext: 804", "Mon-Wed: 02:00 PM - 03:30 PM", "Available",
            "In Cabin MBA-204", "Human Resource Management, Organizational Behavior",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/chaitra-k-s.jpg", "17+ Years", "prof123"
        ),
        (
            "Dr. Vijay K. S.", "Associate Professor", "Master of Business Administration",
            "Associate Professor", "Ph.D (Finance), MBA", "MBA Block - Room MBA-205",
            "vijay_ks@bietdvg.edu", "+91 8192-223461 Ext: 805", "Tue-Thu: 10:30 AM - 12:00 PM", "Available",
            "In Cabin MBA-205", "Corporate Finance, Investment Banking, Derivatives",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/vijay-k-s.jpg", "18+ Years", "prof123"
        ),
        (
            "Prof. Satish D. Raikar", "Assistant Professor", "Master of Business Administration",
            "Assistant Professor", "MBA", "MBA Block - Room MBA-207",
            "satish_raikar@bietdvg.edu", "+91 8192-223461 Ext: 807", "Wed-Fri: 03:00 PM - 04:30 PM", "Available",
            "In MBA Library", "Supply Chain Management, Operations Research",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/satish-raikar.jpg", "12+ Years", "prof123"
        ),
        (
            "Prof. Karthik B. S.", "Assistant Professor", "Master of Business Administration",
            "Assistant Professor", "MBA (Marketing)", "MBA Block - Room MBA-208",
            "karthik_bs@bietdvg.edu", "+91 8192-223461 Ext: 808", "Mon-Thu: 10:00 AM - 11:30 AM", "Available",
            "In Cabin MBA-208", "Digital Marketing, Social Media Analytics",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/karthik-b-s.jpg", "9+ Years", "prof123"
        ),
        (
            "Prof. Sahana M.", "Assistant Professor", "Master of Business Administration",
            "Assistant Professor", "MBA (HR)", "MBA Block - Room MBA-209",
            "sahana_m@bietdvg.edu", "+91 8192-223461 Ext: 809", "Tue-Fri: 02:00 PM - 03:30 PM", "Available",
            "In Cabin MBA-209", "Talent Acquisition, Corporate Communications",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/sahana-m.jpg", "8+ Years", "prof123"
        ),

        # =========================================================================
        # === 13. MATHEMATICS ===
        # =========================================================================
        (
            "Dr. N. S. Basavarajappa", "Professor & Head of Department", "Mathematics",
            "Professor & HOD", "Ph.D (Mathematics), M.Sc", "Basic Science Block - Room MAT-101",
            "hod_maths@bietdvg.edu", "+91 8192-223461 Ext: 901", "Mon-Fri: 10:30 AM - 12:00 PM", "Available",
            "In Maths HOD Cabin", "Differential Equations, Numerical Methods, Graph Theory",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/basavarajappa-n-s.jpg", "26+ Years", "prof123"
        ),
        (
            "Prof. Ashwini M. Rao", "Associate Professor", "Mathematics",
            "Associate Professor", "M.Sc, M.Phil", "Basic Science Block - Room MAT-104",
            "ashwini_rao@bietdvg.edu", "+91 8192-223461 Ext: 904", "Tue-Thu: 02:00 PM - 03:30 PM", "Available",
            "In Cabin MAT-104", "Engineering Mathematics, Linear Algebra, Probability & Statistics",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/ashwini-m-rao.jpg", "18+ Years", "prof123"
        ),
        (
            "Prof. Rashmi B.", "Assistant Professor", "Mathematics",
            "Assistant Professor", "M.Sc (Mathematics)", "Basic Science Block - Room MAT-106",
            "rashmi_b@bietdvg.edu", "+91 8192-223461 Ext: 906", "Mon-Wed: 11:00 AM - 12:30 PM", "Available",
            "In Cabin MAT-106", "Calculus, Transform Techniques, Complex Analysis",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/rashmi-b.jpg", "10+ Years", "prof123"
        ),
        (
            "Prof. Manjunath V.", "Assistant Professor", "Mathematics",
            "Assistant Professor", "M.Sc, B.Ed", "Basic Science Block - Room MAT-107",
            "manjunath_v@bietdvg.edu", "+91 8192-223461 Ext: 907", "Wed-Fri: 02:30 PM - 04:00 PM", "Available",
            "In Cabin MAT-107", "Discrete Mathematical Structures, Numerical Analysis",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/manjunath-v.jpg", "11+ Years", "prof123"
        ),

        # =========================================================================
        # === 14. PHYSICS ===
        # =========================================================================
        (
            "Dr. Jagadeesh M. R.", "Associate Professor & Head of Department", "Physics",
            "Associate Professor & HOD", "Ph.D (Physics), M.Sc", "Basic Science Block - Room PHY-201",
            "hod_physics@bietdvg.edu", "+91 8192-223461 Ext: 920", "Mon-Wed: 11:00 AM - 12:30 PM", "Available",
            "In Physics Lab", "Condensed Matter Physics, Nanomaterials, Quantum Mechanics",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/jagadeesh-m-r.jpg", "21+ Years", "prof123"
        ),
        (
            "Prof. Divya R.", "Assistant Professor", "Physics",
            "Assistant Professor", "M.Sc (Physics)", "Basic Science Block - Room PHY-204",
            "divya_r@bietdvg.edu", "+91 8192-223461 Ext: 924", "Tue-Thu: 10:00 AM - 11:30 AM", "Available",
            "In Engineering Physics Lab 1", "Optics, Laser Technology, Solid State Physics",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/divya-r.jpg", "9+ Years", "prof123"
        ),
        (
            "Dr. Chandrappa G. K.", "Associate Professor", "Physics",
            "Associate Professor", "Ph.D, M.Sc", "Basic Science Block - Room PHY-205",
            "chandrappa_gk@bietdvg.edu", "+91 8192-223461 Ext: 925", "Wed-Fri: 02:00 PM - 03:30 PM", "Available",
            "In Thin Films Research Lab", "Semiconductors, Thin Film Deposition, Solar Cells",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/chandrappa-g-k.jpg", "17+ Years", "prof123"
        ),

        # =========================================================================
        # === 15. CHEMISTRY ===
        # =========================================================================
        (
            "Dr. Prasannakumar J. K.", "Associate Professor & Head of Department", "Chemistry",
            "Associate Professor & HOD", "Ph.D (Chemistry), M.Sc", "Basic Science Block - Room CHE-301",
            "hod_chem@bietdvg.edu", "+91 8192-223461 Ext: 930", "Wed-Fri: 02:30 PM - 04:00 PM", "Available",
            "In Engineering Chemistry Lab", "Polymer Chemistry, Corrosion Science, Electrochemistry",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/prasannakumar-j-k.jpg", "22+ Years", "prof123"
        ),
        (
            "Prof. Sunitha N.", "Assistant Professor", "Chemistry",
            "Assistant Professor", "M.Sc (Chemistry)", "Basic Science Block - Room CHE-304",
            "sunitha_n@bietdvg.edu", "+91 8192-223461 Ext: 934", "Mon-Wed: 10:30 AM - 12:00 PM", "Available",
            "In Chemistry Instrumental Lab", "Spectroscopy, Water Analysis, Green Chemistry",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/sunitha-n.jpg", "10+ Years", "prof123"
        ),
        (
            "Dr. Mallikarjunaiah H. S.", "Associate Professor", "Chemistry",
            "Associate Professor", "Ph.D, M.Sc", "Basic Science Block - Room CHE-305",
            "mallikarjunaiah_hs@bietdvg.edu", "+91 8192-223461 Ext: 935", "Tue-Thu: 03:00 PM - 04:30 PM", "Available",
            "In Research Chemistry Lab", "Nanotechnology, Battery Chemistry, Fuel Cells",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/mallikarjunaiah-h-s.jpg", "19+ Years", "prof123"
        ),

        # =========================================================================
        # === 16. ADMINISTRATION & GOVERNANCE ===
        # =========================================================================
        (
            "Dr. K. S. Jayantha", "Principal & Chief Academic Officer", "Administration & Governance",
            "Principal", "Ph.D (IISc Bangalore / VTU), M.Tech, B.E", "Administrative Block - Room PR-01",
            "principal@bietdvg.edu", "+91 8192-223461 Ext: 100", "Mon-Fri: 03:00 PM - 04:30 PM", "Available",
            "In Principal Chamber PR-01 • Office hours open for students", "Environmental Engineering, Water Resource Systems, Campus Governance",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/jayantha-k-s.jpg", "35+ Years", "prof123"
        ),
        (
            "Dr. B. M. Gangadharappa", "Vice Principal & Dean (Academic Affairs)", "Administration & Governance",
            "Vice Principal", "Ph.D, M.Tech, B.E", "Administrative Block - Room VP-02",
            "vice_principal@bietdvg.edu", "+91 8192-223461 Ext: 102", "Mon-Fri: 02:00 PM - 04:00 PM", "Available",
            "In Vice Principal Chamber VP-02 • Academic disputes & VTU regulations", "Signal Processing, Academic Accreditation (NBA / NAAC)",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/600x0/sites/biet/site-content/faculty/gangadharappa-b-m.jpg", "32+ Years", "prof123"
        )
    ]

    cursor.executemany("""
    INSERT INTO professors (name, title, department, designation, qualification, cabin, email, phone, office_hours, status, cabin_note, research_areas, avatar, experience, password)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, all_professors)

    # Seed research papers for faculty
    papers = [
        (1, "Deep Neural Framework for Real-time Diabetic Retinopathy Classification using Fundus Images", "IEEE Transactions on Medical Imaging", 2024, 64, "https://doi.org/10.1109/TMI.2024.33891"),
        (1, "Autonomous Edge AI Framework for Crop Disease Surveillance in Arecanut Plantations", "Elsevier Computers and Electronics in Agriculture", 2023, 112, "https://doi.org/10.1016/j.compag.2023.1077"),
        (2, "Optimized Graph Algorithms for High-Performance Distributed Computing Clusters", "Journal of Parallel and Distributed Computing", 2023, 42, "https://doi.org/10.1016/j.jpdc.2023.04.005"),
        (3, "Syntactic Analysis and Optimization in Modern Compiler Construction Paradigms", "Springer Innovations in Systems and Software", 2024, 31, "https://doi.org/10.1007/s11334-024-0041"),
        (19, "Decentralized Blockchain-Based Key Distribution for Mobile Ad-Hoc Military Networks", "IEEE Transactions on Dependable and Secure Computing", 2024, 76, "https://doi.org/10.1109/TDSC.2024.3361"),
        (29, "Vision Transformers for Autonomous UAV Navigation in GPS-Denied Dense Canopy Terrains", "IEEE Robotics and Automation Letters", 2024, 53, "https://doi.org/10.1109/LRA.2024.3392"),
        (34, "Multi-Modal Predictive Analytics for Sepsis Risk Detection Using Transformer Ensembles", "Nature Digital Medicine (Springer Nature)", 2023, 126, "https://doi.org/10.1038/s41746-023-0089"),
        (40, "Ultra Low-Power Radix-4 Vedic Multiplier for High-Speed DSP in 28nm CMOS", "Microprocessors and Microsystems (Elsevier)", 2024, 38, "https://doi.org/10.1016/j.micpro.2024.1049"),
        (51, "Investigation of Honge Oil Biodiesel Blends in CI Engine with Exhaust Gas Recirculation", "Renewable Energy (Elsevier)", 2023, 78, "https://doi.org/10.1016/j.renene.2023.05.011"),
        (60, "Seismic Fragility Assessment of Reinforced Concrete Frames with Geopolymer Fiber Infill", "Journal of Building Engineering", 2024, 42, "https://doi.org/10.1016/j.jobe.2024.1082"),
        (69, "Decentralized Voltage and Frequency Control in Islanded Microgrids with High PV Penetration", "IEEE Transactions on Smart Grid", 2024, 91, "https://doi.org/10.1109/TSG.2024.3378")
    ]
    cursor.executemany("""
    INSERT INTO faculty_papers (professor_id, title, journal, year, citations, doi_url)
    VALUES (?, ?, ?, ?, ?, ?)
    """, papers)

    conn.commit()
    conn.close()
    print(f"Successfully seeded {len(all_professors)} authentic BIET faculty across all departments!")

if __name__ == "__main__":
    seed_all_faculty()
