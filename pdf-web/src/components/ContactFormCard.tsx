"use client";

import { useMemo, useState } from "react";

type SubmitState = "idle" | "success" | "error";

interface ContactFormCardProps {
  supportEmail: string;
}

export default function ContactFormCard({ supportEmail }: ContactFormCardProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => (
    name.trim().length >= 2 &&
    email.trim().length > 0 &&
    subject.trim().length >= 3 &&
    message.trim().length >= 20
  ), [email, message, name, subject]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitState("idle");
    setFeedback("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
        }),
      });

      const payload = await response.json() as { ok?: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "We could not send your message right now.");
      }

      setSubmitState("success");
      setFeedback(payload.message || "Your message was sent successfully.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error) {
      setSubmitState("error");
      setFeedback(error instanceof Error ? error.message : "We could not send your message right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="glass-card contact-form-card">
      <div className="contact-form-card-header">
        <p>Send a message</p>
        <h2>Contact support or business</h2>
        <p>
          Use this form for site issues, policy questions, partnership requests, or advertising inquiries. If you
          prefer email, you can write directly to {supportEmail}.
        </p>
      </div>

      <form className="contact-form-grid" onSubmit={handleSubmit}>
        <label className="contact-form-field">
          <span>Your name</span>
          <input
            autoComplete="name"
            className="contact-form-input"
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter your name"
            type="text"
            value={name}
          />
        </label>

        <label className="contact-form-field">
          <span>Email address</span>
          <input
            autoComplete="email"
            className="contact-form-input"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
        </label>

        <label className="contact-form-field contact-form-field-full">
          <span>Subject</span>
          <input
            className="contact-form-input"
            onChange={(event) => setSubject(event.target.value)}
            placeholder="How can we help?"
            type="text"
            value={subject}
          />
        </label>

        <label className="contact-form-field contact-form-field-full">
          <span>Message</span>
          <textarea
            className="contact-form-textarea"
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Tell us what happened, which page you were using, and any details that help us reproduce the issue."
            rows={8}
            value={message}
          />
        </label>

        <div className="contact-form-actions">
          <button className="btn-accent" disabled={!canSubmit || submitting} type="submit">
            {submitting ? "Sending message..." : "Send message"}
          </button>
          <a className="btn-secondary" href={`mailto:${supportEmail}`}>
            Email instead
          </a>
        </div>

        {feedback ? (
          <div
            className={`contact-form-feedback ${submitState === "success" ? "contact-form-feedback-success" : "contact-form-feedback-error"}`}
            role="status"
          >
            {feedback}
          </div>
        ) : null}
      </form>
    </div>
  );
}
