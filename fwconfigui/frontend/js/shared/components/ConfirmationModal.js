/**
 * ConfirmationModal Component
 */

function ConfirmationModal({
  show,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Yes, Continue",
  cancelText = "Cancel",
}) {
  if (!show) return null;

  return (
    <div
      className="modalOverlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modalCard">
        <div className="modalHeader">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
        {message ? <p>{message}</p> : null}
        <div className="modalActions">
          <button className="btn" onClick={onClose}>
            {cancelText}
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
