import requests
import sys

def test_contact_submission():
    url = "http://localhost:8000/api/contact/"
    payload = {
        "email": "test_verification@example.com",
        "subject": "Verification Test Subject",
        "message": "This is a verification test message."
    }
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        print("Contact submission successful")
    except requests.exceptions.RequestException as e:
        print(f"Error submitting contact message: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response content: {e.response.text}")
        sys.exit(1)

if __name__ == "__main__":
    test_contact_submission()
