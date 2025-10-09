from fhir.resources.patient import Patient
from fhir.resources.humanname import HumanName
from fhir.resources.identifier import Identifier
from fhir.resources.address import Address
from datetime import date

def fetch_patient_summary(nhs_number: str) -> Patient:
    """
    A stub function to simulate fetching a patient summary from GP Connect.

    In a real implementation, this function would:
    1. Authenticate with the GP Connect service.
    2. Make a secure API call to `GET /Patient/{nhs_number}`.
    3. Handle potential errors (e.g., patient not found, network issues).
    4. Return the parsed FHIR Patient resource.

    For this demonstration, we return a hardcoded sample Patient resource.
    """
    print(f"Simulating GP Connect lookup for NHS Number: {nhs_number}")

    # Create a sample FHIR Patient resource
    patient = Patient()
    patient.id = "gp-connect-patient-123"

    # Name
    name = HumanName()
    name.use = "official"
    name.family = "Smith"
    name.given = ["John", "Jonathan"]
    patient.name = [name]

    # Identifier (NHS Number)
    identifier = Identifier()
    identifier.system = "https://fhir.nhs.uk/Id/nhs-number"
    identifier.value = nhs_number
    patient.identifier = [identifier]

    # Other details
    patient.birthDate = date(1955, 1, 1).isoformat()
    patient.gender = "male"

    address = Address()
    address.use = "home"
    address.line = ["123 Health Lane"]
    address.city = "London"
    address.postalCode = "SW1A 0AA"
    patient.address = [address]

    # Active status
    patient.active = True

    return patient