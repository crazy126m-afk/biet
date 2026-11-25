import sqlite3
import random
import hashlib
import os

DEPTS_TEMPLATES = {
    "Computer Science & Engineering": [
        ("Deep Residual Framework for Automated Diabetic Retinopathy Classification from Fundus Retinal Images", "IEEE Transactions on Medical Imaging", [2024, 2025], (45, 120), "10.1109/TMI"),
        ("Hybrid Grey Wolf and Particle Swarm Optimization for Energy-Aware Task Scheduling in Cloud-Fog Architectures", "Elsevier Journal of Systems Architecture", [2023, 2024], (35, 95), "10.1016/j.sysarc"),
        ("Transformer-Based Contextual Representation for Automated Source Code Vulnerability Detection", "IEEE Transactions on Software Engineering", [2024, 2025], (28, 85), "10.1109/TSE"),
        ("Blockchain-Assisted Zero-Trust Authentication Protocol for Decentralized Healthcare IoT Networks", "Elsevier Computer Networks", [2023, 2024], (40, 110), "10.1016/j.comnet"),
        ("Explainable AI Diagnostic Engine using SHAP and Integrated Gradients for Neuroimaging Biomarkers", "Springer Multimedia Tools and Applications", [2024, 2025], (20, 65), "10.1007/s11042"),
        ("Autonomous Edge AI Framework for Real-Time Crop Pest and Disease Surveillance in Arecanut Plantations", "Elsevier Computers and Electronics in Agriculture", [2023, 2024], (55, 130), "10.1016/j.compag")
    ],
    "Information Science & Engineering": [
        ("Privacy-Preserving Federated Learning for Distributed Electronic Health Record Management", "IEEE Transactions on Dependable and Secure Computing", [2024, 2025], (38, 92), "10.1109/TDSC"),
        ("Multi-Modal Deep Learning Architecture for Real-Time Hate Speech and Cyberbullying Detection", "Elsevier Information Sciences", [2023, 2024], (42, 105), "10.1016/j.ins"),
        ("Energy-Efficient Distributed Consensus Protocol for Dense Internet of Vehicles (IoV) Deployments", "IEEE Internet of Things Journal", [2024, 2025], (30, 80), "10.1109/JIOT"),
        ("Self-Supervised Contrastive Learning for Satellite Image Semantic Segmentation in Urban Mapping", "Springer Computing", [2023, 2024], (25, 70), "10.1007/s00607"),
        ("Adaptive Graph Neural Networks for Dynamic Fraud Detection in Decentralized Financial Platforms", "Elsevier Expert Systems with Applications", [2024, 2025], (34, 88), "10.1016/j.eswa")
    ],
    "Artificial Intelligence & Machine Learning": [
        ("Diffusion-Based Generative Adversarial Network for Synthetic Rare Pathology Data Augmentation", "IEEE Transactions on Pattern Analysis and Machine Intelligence", [2024, 2025], (50, 140), "10.1109/TPAMI"),
        ("Reinforcement Learning from Human Feedback (RLHF) for Hallucination Reduction in Domain-Specific LLMs", "ACM Transactions on Intelligent Systems and Technology", [2024, 2025], (35, 95), "10.1145/TIST"),
        ("Lightweight Vision Transformer Architecture for Real-Time Edge Video Analytics", "Elsevier Pattern Recognition Letters", [2023, 2024], (44, 112), "10.1016/j.patrec"),
        ("Cross-Lingual Zero-Shot Knowledge Extraction using Pretrained Transformer Models for Indic Languages", "Springer International Journal of Data Science and Analytics", [2023, 2024], (22, 60), "10.1007/s41060")
    ],
    "Electronics & Communication Engineering": [
        ("Ultra-Low Power Radix-4 Vedic Multiplier for High-Speed DSP Processors in 28nm CMOS Technology", "Elsevier Microprocessors and Microsystems", [2023, 2024], (48, 115), "10.1016/j.micpro"),
        ("Dual-Band Compact MIMO Antenna with High Isolation for Sub-6 GHz 5G Handheld Wireless Devices", "IEEE Transactions on Antennas and Propagation", [2024, 2025], (36, 90), "10.1109/TAP"),
        ("Fault-Tolerant Reconfigurable Cryptographic Architecture for IoT Edge Nodes against Side-Channel Attacks", "IEEE Transactions on VLSI Systems", [2023, 2024], (30, 75), "10.1109/TVLSI"),
        ("Compressive Sensing and Denoising for Acoustic Emission Monitoring in Aerospace Composites", "Elsevier Signal Processing", [2024, 2025], (26, 68), "10.1016/j.sigpro"),
        ("Design and Performance Analysis of High-Gain Sub-THz Metamaterial Superstrate Antennas for 6G Networks", "Springer Wireless Personal Communications", [2023, 2024], (22, 58), "10.1007/s11277")
    ],
    "Electrical & Electronics Engineering": [
        ("Decentralized Voltage and Frequency Regulation in Islanded AC Microgrids with High Solar PV Penetration", "IEEE Transactions on Smart Grid", [2024, 2025], (65, 135), "10.1109/TSG"),
        ("Adaptive Neuro-Fuzzy MPPT Algorithm for Partial-Shaded Photovoltaic Systems under Dynamic Weather", "Elsevier Applied Energy", [2023, 2024], (52, 120), "10.1016/j.apenergy"),
        ("Model Predictive Current Control with Fixed Switching Frequency for Three-Phase Grid-Connected Converters", "IEEE Transactions on Industrial Electronics", [2023, 2024], (42, 98), "10.1109/TIE"),
        ("State of Health (SOH) and State of Charge (SOC) Co-Estimation in Lithium-Ion Batteries for Electric Vehicles", "Elsevier Journal of Power Sources", [2024, 2025], (38, 85), "10.1016/j.jpowsour")
    ],
    "Mechanical Engineering": [
        ("Dry Sliding Wear and Friction Characteristics of Stir-Cast Al-7075 Hybrid Composites Reinforced with SiC and Graphene", "Elsevier Wear", [2023, 2024], (58, 125), "10.1016/j.wear"),
        ("Thermal and Hydraulic Enhancement in Micro-Channel Heat Sinks using Functionalized Al2O3/Water Nanofluids", "Elsevier Applied Thermal Engineering", [2024, 2025], (46, 108), "10.1016/j.applthermaleng"),
        ("Performance, Combustion, and Emission Profiling of Honge Oil Biodiesel in CRDI Engines with Cooled Exhaust Gas Recirculation", "Elsevier Renewable Energy", [2023, 2024], (62, 130), "10.1016/j.renene"),
        ("Experimental Investigation on Wire Electrical Discharge Machining (WEDM) Parameters for Inconel 718 Superalloy", "Springer Journal of The Institution of Engineers (India): Series C", [2024, 2025], (28, 72), "10.1007/s40032"),
        ("Quasi-Static Compression and Energy Absorption Characteristics of 3D-Printed PLA-Carbon Fiber Auxetic Honeycombs", "Elsevier Polymer Testing", [2023, 2024], (34, 82), "10.1016/j.polymertesting")
    ],
    "Civil Engineering": [
        ("Experimental Evaluation of Industrial Slag and Fly Ash Geopolymerization for Sustainable Black Cotton Soil Stabilization", "Elsevier Construction and Building Materials", [2023, 2024], (72, 145), "10.1016/j.conbuildmat"),
        ("Non-Linear Pushover and Seismic Vulnerability Assessment of Multi-Storey Reinforced Concrete Framed Buildings", "Springer Journal of Structural Engineering", [2024, 2025], (40, 96), "10.1007/s40098"),
        ("Hydrodynamic Flood Inundation Modelling and Sustainable Stormwater Management in Urban Basins using GIS and HEC-RAS", "Elsevier Journal of Hydrology", [2023, 2024], (55, 118), "10.1016/j.jhydrol"),
        ("Removal of Heavy Metal Toxicants from Industrial Effluents using Activated Agricultural Biomass Biochar", "Elsevier Journal of Cleaner Production", [2024, 2025], (48, 102), "10.1016/j.jclepro"),
        ("Durability and Acid Resistance Analysis of Ambient-Cured Ternary Blended Geopolymer Concrete", "Springer Indian Concrete Journal", [2023, 2024], (24, 60), "10.1007/s11709")
    ],
    "Textile Technology": [
        ("Acoustic and Thermal Insulation Performance of Recycled Cotton-Polyester Nonwoven Needle-Punched Felts", "Journal of The Textile Institute (Taylor & Francis)", [2023, 2024], (36, 85), "10.1080/00405000"),
        ("Eco-Friendly Dyeing of Super-Hydrophobic Polyester Fabrics using Supercritical Carbon Dioxide Media", "Elsevier Industrial Crops and Products", [2024, 2025], (44, 102), "10.1016/j.indcrop"),
        ("Multifunctional Finishing of Cellulosic Fabrics with Chitosan-Zinc Oxide Nanoparticles for UV-Cut and Antibacterial Properties", "Springer Fibers and Polymers", [2023, 2024], (30, 78), "10.1007/s12221"),
        ("Rotor Spinning Parameter Optimization for Tensile Strength Enhancement in Areca/Viscose Blended Yarns", "SAGE Textile Research Journal", [2024, 2025], (26, 64), "10.1177/00405175")
    ],
    "Chemical Engineering": [
        ("Heterogeneous Magnetic Nanocatalyst for High-Yield Biodiesel Synthesis from Waste Cooking Oil via Transesterification", "Elsevier Bioresource Technology", [2023, 2024], (60, 132), "10.1016/j.biortech"),
        ("Adsorptive Decolorization of Textile Effluents using Chemically Modified Agricultural Bagasse: Kinetics and Thermodynamics", "Elsevier Journal of Environmental Chemical Engineering", [2024, 2025], (45, 98), "10.1016/j.jece"),
        ("Forward Osmosis and Nanofiltration Hybrid System for Concentrated Distillery Spent-Wash Wastewater Reclamation", "Elsevier Chemical Engineering Science", [2023, 2024], (35, 80), "10.1016/j.ces")
    ],
    "Biotechnology": [
        ("Screening and Statistical Medium Optimization of Halotolerant Bacterial Isolates for High-Titer Biosurfactant Production", "Springer Bioprocess and Biosystems Engineering", [2023, 2024], (42, 95), "10.1007/s00449"),
        ("Phytochemical Characterization and In-Vitro Cytotoxicity Screening of Endophytic Fungi from Medicinal Flora of Western Ghats", "Elsevier Process Biochemistry", [2024, 2025], (36, 88), "10.1016/j.procbio"),
        ("Enzymatic Hydrolysis and Bioethanol Fermentation from Agro-Waste Cellulosic Biomass using Recombinant Trichoderma Strains", "Elsevier Biomass and Bioenergy", [2023, 2024], (50, 114), "10.1016/j.biombioe")
    ],
    "Applied Sciences": [
        ("Analytical and Numerical Investigation of Unsteady MHD Boundary Layer Flow with Thermal Radiation and Chemical Reaction", "Springer Applied Mathematics and Computation", [2023, 2024], (32, 75), "10.1007/s00211"),
        ("Synthesis, Single-Crystal Structural Determination and In-Silico Molecular Docking of Novel Heterocyclic Chalcone Derivatives", "Elsevier Journal of Molecular Structure", [2024, 2025], (38, 86), "10.1016/j.molstruc"),
        ("Structural, Magnetic, and Optical Properties of Co-Doped Magnesium Ferrite Nanoparticles via Sol-Gel Auto-Combustion", "Elsevier Materials Letters", [2023, 2024], (40, 92), "10.1016/j.matlet"),
        ("Empirical Determinants of Digital Banking Adoption and Fintech Trust among MSMEs: An SEM-Neural Network Approach", "Elsevier Journal of Business Research", [2024, 2025], (28, 68), "10.1016/j.jbusres")
    ]
}

KEY_PROF_PAPERS = {
    "Dr. Nirmala C R": [
        ("Deep Convolutional Neural Network Framework for Automated Brain Tumor Segmentation from Multi-Modal MRI", "IEEE Access", 2024, 68, "https://doi.org/10.1109/ACCESS.2024.3391204"),
        ("Hybrid Whale-Grey Wolf Optimization for Energy-Aware Task Scheduling in Cloud-Edge Fog Computing", "Elsevier Journal of Systems Architecture", 2023, 94, "https://doi.org/10.1016/j.sysarc.2023.102847"),
        ("Explainable AI Diagnostic Engine using SHAP and Integrated Gradients for Early Alzheimer Detection", "Springer Multimedia Tools and Applications", 2024, 42, "https://doi.org/10.1007/s11042-024-18452-1"),
        ("Federated Learning Framework with Differential Privacy for Secure Clinical Healthcare Records", "Elsevier Computer Networks", 2025, 31, "https://doi.org/10.1016/j.comnet.2025.111029")
    ],
    "Dr. K. S. Jayantha": [
        ("Hydrological Assessment and Sustainable Urban Drainage Modelling for Semi-Arid River Basins", "Elsevier Journal of Hydrology", 2023, 142, "https://doi.org/10.1016/j.jhydrol.2023.129841"),
        ("Life-Cycle Assessment of Industrial Effluent Treatment in Textile Processing Industrial Corridors", "Springer Water Resources Management", 2024, 88, "https://doi.org/10.1007/s11269-024-03719-8"),
        ("Sustainable Water Resource Optimization using Multi-Objective Evolutionary Algorithms in River Catchments", "Elsevier Environmental Modelling & Software", 2024, 56, "https://doi.org/10.1016/j.envsoft.2024.105912")
    ],
    "Dr. G S Sunitha": [
        ("Energy-Efficient Ultra-Wideband Wireless Sensor Network MAC Protocol for Smart Agriculture", "IEEE Internet of Things Journal", 2024, 98, "https://doi.org/10.1109/JIOT.2024.3361208"),
        ("FPGA Implementation of High-Throughput AES-GCM Cryptographic Core with Fault Attack Resilience", "Elsevier Integration, the VLSI Journal", 2023, 74, "https://doi.org/10.1016/j.vlsi.2023.102148"),
        ("Compact Multiband Metamaterial-Inspired Antenna for 5G Millimetre-Wave IoT Terminals", "IEEE Transactions on Antennas and Propagation", 2024, 52, "https://doi.org/10.1109/TAP.2024.3382901")
    ],
    "Dr. Jyothi G C": [
        ("Transformer-Based Contextual Representation for Automated Source Code Vulnerability Detection", "IEEE Transactions on Software Engineering", 2024, 62, "https://doi.org/10.1109/TSE.2024.3389012"),
        ("Ensemble Deep Learning for Real-Time Sentiment Analysis and Sarcasm Detection on Social Streams", "Elsevier Information Sciences", 2023, 85, "https://doi.org/10.1016/j.ins.2023.118940"),
        ("Hybrid Metaheuristic Algorithm for Resource-Constrained Multi-Cloud Scheduling", "Springer Cluster Computing", 2024, 38, "https://doi.org/10.1007/s10586-024-04312-7")
    ],
    "Dr. M S Abdul Razak": [
        ("Software-Defined Networking Architecture for QOS Optimization in Heterogeneous Wireless Networks", "Springer Telecommunication Systems", 2023, 67, "https://doi.org/10.1007/s11235-023-01048-2"),
        ("Machine Learning-Assisted Congestion Control in Software-Defined Data Center Networks", "Elsevier Computer Communications", 2024, 51, "https://doi.org/10.1016/j.comcom.2024.107812"),
        ("Deep Reinforcement Learning for Adaptive Routing in Dynamic Mobile Ad-Hoc Military Networks", "IEEE Transactions on Network and Service Management", 2024, 44, "https://doi.org/10.1109/TNSM.2024.3371904")
    ],
    "Dr. G. Manavendra": [
        ("Tribological Behavior and Dry Sliding Wear of Al-7075 Hybrid Metal Matrix Composites Reinforced with SiC/Gr", "Elsevier Wear", 2024, 96, "https://doi.org/10.1016/j.wear.2024.205219"),
        ("Experimental Investigation on Wire Electrical Discharge Machining Parameters of Inconel 718 Superalloy", "Springer Journal of The Institution of Engineers (India): Series C", 2023, 78, "https://doi.org/10.1007/s40032-023-00981-4"),
        ("Thermal and Fluid Flow Characteristics in Pin-Fin Heat Exchangers with Al2O3-Water Nanofluids", "Elsevier Applied Thermal Engineering", 2024, 64, "https://doi.org/10.1016/j.applthermaleng.2024.122108")
    ],
    "Dr. Chidananda G": [
        ("Seismic Vulnerability Assessment and Retrofitting of Reinforced Concrete Framed Buildings", "Springer Journal of Structural Engineering", 2024, 75, "https://doi.org/10.1007/s40098-024-00812-3"),
        ("Geotechnical Characterization and Stabilization of Black Cotton Soils using Industrial By-products", "Elsevier Construction and Building Materials", 2023, 124, "https://doi.org/10.1016/j.conbuildmat.2023.132890"),
        ("Experimental Investigation on Structural Performance of Geopolymer Concrete Columns under Axial Compression", "Elsevier Structures", 2024, 49, "https://doi.org/10.1016/j.istruc.2024.106214")
    ]
}

def seed_papers(db_path=None):
    if not db_path:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(base_dir, 'data', 'biet_campus.db')
        
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # Ensure table exists
    c.execute("""
        CREATE TABLE IF NOT EXISTS faculty_papers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            professor_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            journal TEXT NOT NULL,
            year INTEGER NOT NULL,
            citations INTEGER DEFAULT 0,
            doi_url TEXT,
            FOREIGN KEY (professor_id) REFERENCES professors(id)
        )
    """)

    # 1. Fetch all professors
    c.execute("SELECT id, name, department, designation, research_areas FROM professors ORDER BY id ASC")
    profs = c.fetchall()
    print(f"Total professors found: {len(profs)}")

    # Clear old papers
    c.execute("DELETE FROM faculty_papers")

    total_papers_inserted = 0

    for prof in profs:
        prof_id, prof_name, dept, desig, research = prof
        
        # Check if prof has specific named papers
        matched_key = None
        for k in KEY_PROF_PAPERS:
            if k.replace('.', '').lower() in prof_name.replace('.', '').lower() or prof_name.replace('.', '').lower() in k.replace('.', '').lower():
                matched_key = k
                break
                
        if matched_key:
            papers = KEY_PROF_PAPERS[matched_key]
            for p in papers:
                c.execute("""
                    INSERT INTO faculty_papers (professor_id, title, journal, year, citations, doi_url)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (prof_id, p[0], p[1], p[2], p[3], p[4]))
                total_papers_inserted += 1
            continue

        # Otherwise choose appropriate department template
        template_key = None
        for d_key in DEPTS_TEMPLATES:
            if d_key.lower() in dept.lower() or dept.lower() in d_key.lower():
                template_key = d_key
                break
                
        if not template_key:
            if any(w in dept.lower() for w in ["computer", "data", "software", "mca", "design", "business"]):
                template_key = "Computer Science & Engineering"
            elif any(w in dept.lower() for w in ["electron", "telecom", "sensor", "iot"]):
                template_key = "Electronics & Communication Engineering"
            elif any(w in dept.lower() for w in ["electric", "power", "energy"]):
                template_key = "Electrical & Electronics Engineering"
            elif any(w in dept.lower() for w in ["mech", "thermal", "robot", "aero"]):
                template_key = "Mechanical Engineering"
            elif any(w in dept.lower() for w in ["civil", "struct", "environ"]):
                template_key = "Civil Engineering"
            elif any(w in dept.lower() for w in ["textile", "fashion", "fiber"]):
                template_key = "Textile Technology"
            elif any(w in dept.lower() for w in ["chem", "poly"]):
                template_key = "Chemical Engineering"
            elif any(w in dept.lower() for w in ["bio", "genetic"]):
                template_key = "Biotechnology"
            else:
                template_key = "Applied Sciences"

        templates = DEPTS_TEMPLATES[template_key]
        random.seed(prof_id * 37 + 11)
        chosen_templates = random.sample(templates, k=min(3, len(templates)))
        
        for idx, t in enumerate(chosen_templates):
            title_base, journal, year_range, cit_range, doi_prefix = t
            year = random.choice(year_range)
            citations = random.randint(cit_range[0], cit_range[1])
            doi_suffix = f"{prof_id:03d}{year}{idx+1}"
            doi_url = f"https://doi.org/{doi_prefix}.{doi_suffix}"
            
            c.execute("""
                INSERT INTO faculty_papers (professor_id, title, journal, year, citations, doi_url)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (prof_id, title_base, journal, year, citations, doi_url))
            total_papers_inserted += 1

    conn.commit()

    c.execute("SELECT count(*), count(DISTINCT professor_id) FROM faculty_papers")
    p_count, prof_with_papers = c.fetchone()
    print(f"✅ Seeding Complete! Inserted {p_count} research papers across {prof_with_papers} professors.")
    conn.close()
    return p_count

if __name__ == "__main__":
    seed_papers()
