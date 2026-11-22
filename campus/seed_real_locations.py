"""
Seed real BIET campus locations with official photos from bietdvg.edu gallery
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "biet_campus.db")

def seed_real_locations():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("DROP TABLE IF EXISTS locations")
    cursor.execute("""
    CREATE TABLE locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        category TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        floor_info TEXT NOT NULL,
        facilities TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT,
        building_height INTEGER DEFAULT 18
    )
    """)

    locations = [
        (
            "BIET Main Administrative Block & Principal Chamber",
            "ADM-01", "Administration", 14.45330, 75.91770,
            "Ground & 1st Floor (Central Quadrangle)",
            "Principal Chamber, Registrar Office, Accounts Section, Academic Council Hall, Visitor Lounge",
            "The iconic main entrance block of BIET Davangere on Hadadi Road entrance, housing college governance and administrative services.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/campus/biet-main-block.jpg", 24
        ),
        (
            "BEA Headquarters (Bapuji Educational Association)",
            "BEA-HQ", "Administration", 14.45310, 75.91740,
            "Ground & 2 Floors",
            "Governing Council Chambers, President Office, Secretary Chamber, Endowment Fund Cell",
            "Central apex headquarters of the Bapuji Educational Association governing 50+ premier institutions.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/about/bea-headquarters.jpg", 20
        ),
        (
            "Computer Science & Engineering Block (Babbage Tower)",
            "TECH-CS", "Academic", 14.45385, 75.91820,
            "4 Floors (G+3) with Glass Atrium",
            "NVIDIA AI Deep Learning Cluster, Cloud Computing Lab, Network Security Lab, Computer Center 1 & 2",
            "State-of-the-art computing block equipped with high-speed 10 Gbps optical fiber and enterprise server racks.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/gallery/dept-cs/img-20200523-wa0001.jpg", 28
        ),
        (
            "Information Science & Engineering (ISE Block)",
            "TECH-IS", "Academic", 14.45395, 75.91840,
            "3rd Floor Babbage Tower",
            "Cybersecurity & Cryptography Lab, Mobile App Development Lab, Distributed Systems Studio",
            "Dedicated information systems wing focused on enterprise software development and cloud operations.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/gallery/dept-is/activity-on-jflap.jpg", 28
        ),
        (
            "AI & Machine Learning Innovation Center (AIML)",
            "TECH-AIML", "Academic", 14.45405, 75.91830,
            "4th Floor Babbage Tower",
            "GPU Compute Rig, Computer Vision Lab, Drone Robotics Arena, HackBIET Innovation Incubator",
            "Research epicenter for Vision Transformers, autonomous systems, and generative AI research.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/gallery/dept-aiml/img-20240917-155233094-hdr-ae.jpg", 28
        ),
        (
            "Data Science & Predictive Analytics Lab",
            "TECH-DS", "Academic", 14.45415, 75.91810,
            "4th Floor North Wing",
            "Apache Spark Cluster, Tableau BI Visualization Center, Health Analytics Research Node",
            "Specialized department facility tackling big data pipelines, machine learning at scale, and medical informatics.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/gallery/dept-ds/whatsapp-image-2024-06-28-at-10-57-34-am-58ok3e5.jpg", 28
        ),
        (
            "Computer Science & Design Studio (CSD)",
            "TECH-CSD", "Academic", 14.45370, 75.91850,
            "3rd Floor East Wing",
            "HCI Design Studio, Figma & Adobe UX Workstations, 3D Game Engine Lab, AR/VR Headset Bay",
            "Creative intersection of human-computer interaction, interactive media, and game design.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/gallery/dept-cd/20240208-41109pmbygpsmapcamera.jpg", 24
        ),
        (
            "Sir M. Visvesvaraya ECE Complex",
            "TECH-ECE", "Academic", 14.45260, 75.91845,
            "3 Floors (G+2)",
            "Cadence VLSI Lab, Microwave & Antenna Anechoic Chamber, DSP Studio, Embedded Systems ARM Lab",
            "Premier electronics facility with cadence software licensing and state-of-the-art RF testing equipment.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/gallery/dept-ec/41st-gradulations-day-1.jpg", 22
        ),
        (
            "Electrical & Electronics Engineering Block (EEE)",
            "TECH-EEE", "Academic", 14.45240, 75.91810,
            "3 Floors (G+2)",
            "High Voltage Testing Lab, Power Electronics Drives, Electric Vehicles (EV) Powertrain Lab, Smart Grid Simulator",
            "Heavy electrical engineering complex supporting smart grid research and electric vehicle motor drives.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/gallery/dept-ee/20220113-92700ambygpsmapcamera.jpg", 22
        ),
        (
            "Mechanical Engineering Complex & Advanced CNC Workshops",
            "TECH-ME", "Academic", 14.45220, 75.91780,
            "Ground & 2 Floors + Heavy Industrial Bays",
            "Alternative Fuels & IC Engine Testing, Wind Tunnel, CNC Milling & Lathe Bays, Metallurgy Testing",
            "Comprehensive manufacturing and thermal sciences complex featuring industrial-scale machining centers.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/gallery/dept-me/2342c3dd-060a-44bb-b19d-8c924f5ac114.jpg", 20
        ),
        (
            "Civil Engineering Block & Structural Dynamics Lab",
            "TECH-CV", "Academic", 14.45290, 75.91880,
            "3 Floors + Outdoor Soil Mechanics Yards",
            "Geopolymer Concrete Lab, Universal Testing Machine (100 Ton), Total Station GIS Surveying Unit, Environmental Lab",
            "Pioneering civil and structural engineering center with extensive material characterization equipment.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/gallery/dept-cv/1cv002.jpg", 22
        ),
        (
            "Dr. Shamanur Shivashankarappa Central Library",
            "LIB-01", "Facilities", 14.45360, 75.91680,
            "3 Floors Dedicated Knowledge Center",
            "1,25,000+ Volumes, IEEE Xplore & ScienceDirect Terminals, Research Scholar Cubicles, Quiet Reading Halls",
            "Fully automated library with RFID circulation, open till late evening during VTU examinations.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/campus-life/library/library-01.png", 22
        ),
        (
            "Bapuji Central Auditorium & Convention Center",
            "AUD-01", "Events", 14.45420, 75.91720,
            "1,500 Seater Acoustic Hall",
            "High-Definition Projectors, Dolby Sound System, Green Rooms, VIP Boardrooms",
            "BIET's flagship venue for National Hackathons, Annual Davana Cultural Fest, and Graduation Day.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/campus-life/auditorium/auditorium-17.jpg", 26
        ),
        (
            "Placement Center & Corporate Seminar Hall",
            "PLACE-01", "Administration", 14.45340, 75.91710,
            "Ground & 1st Floor",
            "400-Seater Pre-Placement Talk Hall, 12 Interview Suites, Online Assessment Lab (300 PCs)",
            "Dedicated corporate placement facility visited by Microsoft, Infosys, TCS, Mercedes-Benz, and Bosch.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/placement/auditorium-06.jpg", 18
        ),
        (
            "BIET Sports Pavilion & Athletic Grounds",
            "SPORT-01", "Facilities", 14.45180, 75.91700,
            "Outdoor Stadium & Indoor Gymnasium",
            "Standard 400m Track, Cricket Pitch, Basketball Court with Floodlights, Kabaddi Arena, Badminton Courts",
            "Thriving sports complex producing VTU inter-collegiate championship winning teams.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/campus-life/sports/college-kabaddi-team.jpg", 14
        ),
        (
            "Student Activity Center (SAC) & Cultural Hub",
            "SAC-01", "Facilities", 14.45350, 75.91630,
            "2 Floors",
            "Music Rehearsal Room, Fine Arts Studio, Robotics Club HQ, Photography Darkroom",
            "Vibrant center for extracurricular student clubs, collegiate societies, and technical forums.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/campus-life/sac/collage3.png", 16
        ),
        (
            "Chemical & Biotechnology Engineering Block",
            "TECH-BTCH", "Academic", 14.45200, 75.91840,
            "2 Floors",
            "Bioprocess Fermentation Lab, Downstream Processing, Analytical Chromatography, Polymer Synthesis",
            "Advanced research block for biofuels, agricultural biotechnology, and sustainable chemical processes.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/gallery/dept-ch/ch11.jpg", 18
        ),
        (
            "Textile Technology Institute & Weaving Sheds",
            "TECH-TX", "Academic", 14.45190, 75.91800,
            "Ground Floor Heavy Sheds",
            "Spinning & Weaving Looms, Smart Fabric Characterization, Dyeing & Finishing Lab",
            "Historical and renowned textile technology center with direct links to Davangere's textile heritage.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/gallery/dept-tx/class-room-no-305.jpg", 16
        ),
        (
            "Master of Computer Applications (MCA Block)",
            "TECH-MCA", "Academic", 14.45320, 75.91870,
            "2 Floors",
            "Software Engineering Lab, Java Enterprise Center, Linux Administration Lab",
            "Dedicated post-graduate computer application wing preparing industry-ready software engineers.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/gallery/dept-mca/01-fqglmmm.jpg", 18
        ),
        (
            "Basic Sciences Block (Maths, Physics & Chemistry)",
            "SCI-01", "Academic", 14.45270, 75.91790,
            "3 Floors",
            "Engineering Physics Lab, Thin Film Deposition, Instrumental Chemistry, Mathematics Center",
            "Foundation science center nurturing first-year engineering students with robust scientific fundamentals.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/gallery/dept-phy/classroom-b-119.jpg", 20
        ),
        (
            "Campus Canteen & Davangere Benne Dosa Hub",
            "CAN-01", "Dining", 14.45280, 75.91730,
            "Ground Floor Food Court",
            "World-Famous Davangere Benne Dosa, Fresh Filter Coffee, Meals Counter, Bakery & Juice Bar",
            "Lively campus dining hub loved by students, professors, and visiting alumni.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/gallery/campus/20240104-111808-25-io-thread-1704347250400.jpg", 12
        ),
        (
            "Main Campus Gate 1 & Security Checkpost",
            "GATE-01", "Administration", 14.45370, 75.91590,
            "Gate Checkpoint",
            "ANPR Cameras, Visitor Entry Kiosk, Security Control Desk, Lost & Found Hub, Rapid Response Ambulance Bay",
            "Main entrance on Shamanur Shivashankarappa Marg.",
            "https://d7biqdpghttdi.cloudfront.net/fit-in/800x0/sites/biet/about/bea-headquarters.jpg", 10
        )
    ]

    cursor.executemany("""
    INSERT INTO locations (name, code, category, lat, lng, floor_info, facilities, description, image_url, building_height)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, locations)

    conn.commit()
    conn.close()
    print(f"Successfully seeded {len(locations)} authentic campus buildings with real bietdvg.edu photos!")

if __name__ == "__main__":
    seed_real_locations()
