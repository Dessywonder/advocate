from fhir.resources.patient import Patient
from fhir.resources.humanname import HumanName
from fhir.resources.identifier import Identifier
from fhir.resources.address import Address
from datetime import date

# This is a simplified mapping for demonstration purposes.
# A real-world implementation would be more comprehensive and handle more edge cases.

def map_client_to_fhir_patient(client_data: dict) -> Patient:
    """
    Maps our internal client data dictionary to a FHIR Patient resource.
    """

    # Create the basic Patient resource
    patient = Patient()
    patient.id = str(client_data.get('client_id'))

    # Map name - FHIR names are complex, so we'll create a simple one
    name = HumanName()
    name.use = "official"
    # Our 'initials' field is not a full name, so we'll use it as a placeholder.
    # A real system would need a full name field.
    name.text = f"Patient (Initials: {client_data.get('initials')})"
    patient.name = [name]

    # Map date of birth
    if client_data.get('dob'):
        patient.birthDate = client_data.get('dob').isoformat()

    # Map gender - FHIR has a specific codeset
    gender_map = {
        "Male": "male",
        "Female": "female",
        "Other": "other",
    }
    fhir_gender = gender_map.get(client_data.get('gender'), "unknown")
    patient.gender = fhir_gender

    # Map address
    if client_data.get('address'):
        address = Address()
        address.use = "home"
        address.text = client_data.get('address')
        patient.address = [address]

    # Add an identifier (e.g., our internal client ID)
    identifier = Identifier()
    identifier.system = "urn:system:care-platform/client-id"
    identifier.value = str(client_data.get('client_id'))
    patient.identifier = [identifier]

    return patient