"""
One-time script: creates User (role=dermatologist) + DermatologistProfile
records for the 10 Rajahmundry clinics.

Run from the backend/ directory, with your venv active:
    python -m seed.seed_dermatologists
"""
import re

from app.database import SessionLocal
from app.auth import hash_password
from app import models

TEMP_PASSWORD = "TempPass2026!Derm"  # meets the 12-char minimum; change per-account later

CLINICS = [
    {
        "name": "Dr. Haranath Palivela",
        "clinic": "Bhavya Skin Clinic",
        "address": "46-12-14, Danavaipet, Near Sagar Children Hospital, Rajahmundry, Andhra Pradesh 533103",
        "phones": ["+91-883-243-7848", "+91-99129-20513", "+91-90007-75577"],
        "website": "https://www.lybrate.com/rajahmundry/clinic/bhavya-skin-clinic-danavaipet",
        "specialties": ["Dermatology", "Acne", "Allergy", "Cosmetic treatments"],
    },
    {
        "name": "Dr. Sahitya",
        "clinic": "Sahitya's Dermacure Clinic",
        "address": "1st Floor, Above Bank of Baroda, Manasa Hospital Road, Opp. Prakash Nagar, Rajahmundry, Andhra Pradesh 533106",
        "phones": [],
        "website": None,
        "specialties": ["Skin care", "Hair care", "Laser", "Pigmentation", "Acne"],
    },
    {
        "name": "Dr. Pantham Achuta Rama Rao",
        "clinic": "Pantham Skin Clinic",
        "address": "Gandhipuram, Sai Nagar Road, Prakasam Nagar, Rajahmundry, Andhra Pradesh 533103",
        "phones": [],
        "website": "https://www.justdial.com/Rajahmundry/Dr-Pantham-Achuta-Rama-Rao-Skin-Clinic-Gandhipuram-Prakasam-Nagar",
        "specialties": ["Dermatology", "Skin surgery"],
    },
    {
        "name": "Dr. Lasya Priya",
        "clinic": "Derma Glo Skin & Hair Laser Clinic",
        "address": "Opp. Life Medical Store, Danavaipeta, Rajahmundry, Andhra Pradesh 533103",
        "phones": ["+91-85117-22157"],
        "website": "https://www.justdial.com/Rajahmundry/Dr-Lasyas-Derma-Glo-Skin-Hair-Laser-Clinc-Opp-Life-Medical-Store-Danavaipeta",
        "specialties": ["Skin", "Hair", "Laser treatments"],
    },
    {
        "name": "Dr. Ram",
        "clinic": "Dr. Ram's Aura Skin Clinic",
        "address": "12-21-12, Behind Gokavaram Bus Stand, Opp. Fire Station, Aryapuram (Devi Chowk), Rajahmundry, Andhra Pradesh 533101",
        "phones": ["+91-84601-94446"],
        "website": "https://aura-skin-clinic.business.site",
        "specialties": ["Skin", "Hair", "Cosmetic Dermatology"],
    },
    {
        "name": "Dr. Chandana",
        "clinic": "La Skin 360",
        "address": "74-11-6, Near Panchamukha Anjaneya Swamy Temple, Prakash Nagar, Rajahmundry, Andhra Pradesh 533103",
        "phones": ["+91-84602-93381", "+91-79963-60360", "+91-89703-60360"],
        "website": "mailto:laskin360@gmail.com",
        "specialties": ["Plastic Surgery", "Dermatology", "Aesthetic treatments"],
    },
    {
        "name": "Tvacha Skin Clinic",
        "clinic": "Tvacha Skin Clinic",
        "address": "GSL Swatantra Hospital, Near Kambala Park, Kambala Peta, Rajahmundry, Andhra Pradesh 533101",
        "phones": ["+91-63094-11666"],
        "website": "https://www.facebook.com/tvachaskinclinic1",
        "specialties": ["General Dermatology", "Skin & Hair care"],
    },
    {
        "name": "Dr. Sri Raghu",
        "clinic": "Sri Raghu Skin & Cosmetology Clinic",
        "address": "Door No. 6-17-5, Near Kotipally Bus Stand, Pandiri Vari St, T Nagar, Rajahmundry, Andhra Pradesh 533101",
        "phones": ["+91-81281-66730"],
        "website": None,
        "specialties": ["Skin", "Cosmetology"],
    },
    {
        "name": "Dr. Kavitha",
        "clinic": "Kavitha Skin Clinic & Sri Ravi Hospitals Dermatology Center",
        "address": "86-5-5, Tilak Road, Gandhipuram, Rajahmundry, Andhra Pradesh 533101",
        "phones": ["+91-88883-91234"],
        "website": "http://www.kavithaskinclinics.com",
        "specialties": ["Skin & Hair", "Anti-aging", "Acne"],
    },
    {
        "name": "Clear Skin Clinic",
        "clinic": "Clear Skin Clinic",
        "address": "Kambala Park Road, Rajahmundry, Andhra Pradesh 533101",
        "phones": [],
        "website": None,
        "specialties": ["General Dermatology"],
    },
]


def slugify(text: str) -> str:
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return text


def build_bio(clinic: dict) -> str:
    if len(clinic["phones"]) > 1:
        return "Additional numbers: " + ", ".join(clinic["phones"][1:])
    return ""


def seed():
    db = SessionLocal()
    created = 0
    try:
        for clinic in CLINICS:
            slug = slugify(clinic["clinic"])
            email = f"{slug}@dermatologists.example"

            existing = db.query(models.User).filter(models.User.email == email).first()
            if existing:
                print(f"Skipping (already exists): {clinic['name']} <{email}>")
                continue

            user = models.User(
                full_name=clinic["name"],
                email=email,
                hashed_password=hash_password(TEMP_PASSWORD),
                role=models.RoleEnum.dermatologist,
                is_active=True,
            )
            db.add(user)
            db.flush()  # get user.id before creating the profile

            profile = models.DermatologistProfile(
                user_id=user.id,
                phone=clinic["phones"][0] if clinic["phones"] else None,
                clinic_name=clinic["clinic"],
                specialty="; ".join(clinic["specialties"]),
                bio=build_bio(clinic) or None,
                address=clinic["address"],
                website=clinic["website"],
                accepting_new_patients=True,
            )
            db.add(profile)
            created += 1
            print(f"Created: {clinic['name']} ({clinic['clinic']}) <{email}>")

        db.commit()
        print(f"\nDone. {created} dermatologist account(s) created.")
        print(f"Temporary password for all seeded accounts: {TEMP_PASSWORD}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()