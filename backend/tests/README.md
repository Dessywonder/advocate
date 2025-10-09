# Backend Testing Guide

This document explains how to run the automated tests for the backend application.

## Prerequisites

- You must have Python installed.
- You must have the backend dependencies installed, including the testing libraries. You can install them from the `backend` directory:
  ```bash
  pip install -r requirements.txt
  ```

## Running the Tests

To run the entire test suite, navigate to the root directory of the project and run the following command:

```bash
pytest backend/
```

`pytest` will automatically discover and run all the test files located in the `backend/tests` directory.

### Expected Output

If all tests pass, you will see an output indicating the number of passed tests, for example:

```
============================= test session starts ==============================
...
collected 3 items

backend/tests/test_integration_client.py .                               [ 33%]
backend/tests/test_security.py ..                                        [100%]

============================== 3 passed in 0.12s ===============================
```

If any tests fail, `pytest` will provide a detailed report indicating the cause of the failure.