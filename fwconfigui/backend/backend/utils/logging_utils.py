import functools
import inspect
import logging
from typing import Any, Callable, Dict, Iterable, TypeVar


F = TypeVar("F", bound=Callable[..., Any])


def log_started_completed(fn: F) -> F:
    """Log 'started <function>' and 'completed <function>' around a function call.

    Works for both sync and async functions.
    """

    name = getattr(fn, "__qualname__", getattr(fn, "__name__", str(fn)))
    filename = getattr(getattr(fn, "__code__", None), "co_filename", "")
    file_label = filename.rsplit("/", 1)[-1] if isinstance(filename, str) and filename else "<unknown>"

    if inspect.iscoroutinefunction(fn):

        @functools.wraps(fn)
        async def _async_wrapper(*args: Any, **kwargs: Any) -> Any:
            logging.info("started %s [%s]", name, file_label)
            try:
                return await fn(*args, **kwargs)
            finally:
                logging.info("completed %s [%s]", name, file_label)

        return _async_wrapper  # type: ignore[return-value]

    @functools.wraps(fn)
    def _sync_wrapper(*args: Any, **kwargs: Any) -> Any:
        logging.info("started %s [%s]", name, file_label)
        try:
            return fn(*args, **kwargs)
        finally:
            logging.info("completed %s [%s]", name, file_label)

    return _sync_wrapper  # type: ignore[return-value]


def log_all_methods(*, skip: Iterable[str] = ()) -> Callable[[type], type]:
    """Class decorator: wrap all methods with started/completed logs."""

    skip_set = set(skip)

    def _decorate(cls: type) -> type:
        for name, val in list(cls.__dict__.items()):
            if name in skip_set:
                continue
            if name.startswith("_") and not (name.startswith("__") and name.endswith("__")):
                continue
            if name.startswith("__") and name.endswith("__"):
                continue

            # Methods on the class are functions (or descriptors wrapping functions).
            if inspect.isfunction(val) or inspect.ismethoddescriptor(val):
                setattr(cls, name, log_started_completed(val))
        return cls

    return _decorate


def log_module_functions(module_globals: Dict[str, Any], *, skip: Iterable[str] = ()) -> None:
    """Wrap module-level functions defined in the module with started/completed logs."""

    skip_set = set(skip)
    module_name = str(module_globals.get("__name__") or "")
    for name, val in list(module_globals.items()):
        if name in skip_set:
            continue
        if name.startswith("__"):
            continue
        if not inspect.isfunction(val):
            continue
        if getattr(val, "__module__", "") != module_name:
            continue
        module_globals[name] = log_started_completed(val)
