const DEFAULT_SUBJECT = "Welcome to Myca Collective!";
const DEFAULT_BODY = `<p>Hi {{firstName}},</p>

<p>I'm so excited to officially welcome you to Myca Collective&mdash;can't wait to have you in the community!</p>

<p><strong>Next Steps:</strong></p>
<ul>
  <li>Join our WhatsApp group (<a href="https://chat.whatsapp.com/JgRYvQwfhqXGRuTa20eT8y">link here</a>) to stay up to date</li>
  <li>Follow us on Instagram at <a href="https://instagram.com/myca_collective">@myca_collective</a></li>
  <li>Follow our events on Luma (<a href="https://lu.ma/mycacollective?k=c">link here</a>)</li>
  <li>Join our LinkedIn group (<a href="https://www.linkedin.com/groups/16054018/">link here</a>)</li>
</ul>

<p>We're also building a member portal where you'll be able to connect with other members, find events, and more — stay tuned!</p>

<p>Myca was founded to bring together inspiring women working at the intersection of food, technology, and community. Know someone who might be a great fit? Feel free to send them our <a href="https://www.mycacollective.com/join-us">application form</a>.</p>

<p>Can't wait to see you in person soon,<br>
Emma<br>
<a href="https://www.linkedin.com/in/emmalforman/">LinkedIn</a></p>`;

function wrapInEmailLayout(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
      background-color: #ffffff;
    }
    a { color: #1a73e8; text-decoration: underline; }
    ul { padding-left: 20px; }
    li { margin-bottom: 8px; }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
}

export function buildAcceptanceEmail(memberName: string): {
  subject: string;
  html: string;
} {
  const firstName = memberName.split(" ")[0];
  const finalBody = DEFAULT_BODY.replace(/\{\{firstName\}\}/g, firstName);

  return {
    subject: DEFAULT_SUBJECT,
    html: wrapInEmailLayout(finalBody),
  };
}
