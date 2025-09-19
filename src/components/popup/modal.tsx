import React from 'react';
import './modal.css'; // We'll create this next
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const [isClosing, setIsClosing] = React.useState(false);
  const [shouldRender, setShouldRender] = React.useState(isOpen);
  const [isAnimating, setIsAnimating] = React.useState(false);

  // Handle opening
  React.useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      setIsAnimating(true);
      
      // Allow backdrop clicks after opening animation completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 400); // Match the opening animation duration
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle closing
  React.useEffect(() => {
    if (!isOpen && shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsClosing(false);
        setShouldRender(false);
        setIsAnimating(false);
      }, 300); // Match the closing animation duration
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  // This stops clicks inside the modal from closing it
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Prevent closing during animations to avoid flash
    if (isAnimating || isClosing) {
      return;
    }
    
    // Only close if clicking the backdrop, not the content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleClose = () => {
    if (!isAnimating && !isClosing) {
      onClose();
    }
  };

  return (
    <div className={`modal-overlay ${isClosing ? 'closing' : ''} ${isAnimating ? 'opening' : ''}`} onClick={handleBackdropClick}>
      <div className="modal-content" onClick={handleContentClick}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close-button" onClick={handleClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;