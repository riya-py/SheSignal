class AIError(Exception):
    """Raised for any AI-provider failure: timeout, transport error, non-2xx
    response, or a response that isn't valid/parseable JSON. Callers must
    catch this and degrade gracefully — it must never propagate to the
    client as a raw error (see app/errors.py)."""