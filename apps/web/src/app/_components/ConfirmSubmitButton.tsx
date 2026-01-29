"use client";

import { useState, MouseEvent } from "react";
import { ConfirmModal } from "./modals/ConfirmModal";

type ConfirmSubmitButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "onClick"
> & {
  confirmMessage: string;
  onClick?: React.ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
};

export function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  ...props
}: ConfirmSubmitButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [targetForm, setTargetForm] = useState<HTMLFormElement | null>(null);
  const [submitter, setSubmitter] = useState<HTMLButtonElement | null>(null);
  const [pendingEvent, setPendingEvent] = useState<MouseEvent<HTMLButtonElement> | null>(null);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setTargetForm(event.currentTarget.closest('form'));
    setSubmitter(event.currentTarget);
    setPendingEvent(event);
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (targetForm) {
      // Pass the submitter to support formAction (Server Actions)
      if (submitter) {
        targetForm.requestSubmit(submitter);
      } else {
        targetForm.requestSubmit();
      }
    }

    if (onClick && pendingEvent) {
      onClick(pendingEvent);
    }

    setShowModal(false);
  };

  return (
    <>
      <button
        {...props}
        className={`active-press transition-transform ${props.className || ""}`}
        type="submit"
        onClick={handleClick}
      />
      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
        message={confirmMessage}
        isDestructive={
          props.className?.includes("red") ||
          props.className?.includes("destructive") ||
          props.className?.includes("danger")
        }
      />
    </>
  );
}

