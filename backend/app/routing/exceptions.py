class RouteProviderError(Exception):
    """Raised for any routing-provider failure: timeout, transport error,
    non-2xx response, or an unparseable response. Callers must catch this
    and respond with a safe, generic error - never leak provider internals
    to the client."""