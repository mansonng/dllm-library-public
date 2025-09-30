import { Link } from "@mui/material";

export const convertLinksToClickable = (text: string) => {
  // Enhanced regex to match URLs with or without protocols
  const urlRegex = /((?:https?:\/\/|ftp:\/\/|www\.)[^\s<>()[\]{}'"]+|[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+([^\s<>()[\]{}'"]*)?)/gi;

  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    // Reset regex for testing individual parts
    const testRegex = /((?:https?:\/\/|ftp:\/\/|www\.)[^\s<>()[\]{}'"]+|[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+([^\s<>()[\]{}'"]*)?)/gi;
    if (testRegex.test(part)) {
      let href = part;

      // Add protocol if missing
      if (!part.match(/^https?:\/\//i)) {
        if (part.match(/^www\./i)) {
          href = `https://${part}`;
        } else if (part.match(/^ftp\./i)) {
          href = `ftp://${part}`;
        } else if (part.includes('.')) {
          // If it contains a dot but no protocol, assume https
          href = `https://${part}`;
        }
      }

      return (
        <Link
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            wordBreak: 'break-all',
            color: 'primary.main',
            textDecoration: 'underline',
            '&:hover': {
              textDecoration: 'underline',
              opacity: 0.8,
            }
          }}
        >
          {part}
        </Link>
      );
    }
    return part;
  });
};