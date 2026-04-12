"use client";

export default function NewsletterPage() {
  return (
    <div className="h-[calc(100vh-57px)] flex flex-col bg-ivory">
      <iframe
        src="https://aisnackclub.com/events"
        className="w-full flex-1 border-0"
        title="AI Snack Club Newsletter"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
