import { Html, Head, Body, Container, Text, Heading, Button, Img } from "@react-email/components";

interface CustomEmailProps {
  subject: string;
  message: string;
  buttonText?: string;
  buttonUrl?: string;
  imageUrl?: string;
}

export default function CustomEmail({ subject, message, buttonText, buttonUrl, imageUrl }: CustomEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "Arial, sans-serif", padding: "20px", backgroundColor: "#f3f3f3" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
          
          {/* Dynamically Insert Image */}
          {imageUrl && <Img src={imageUrl} width="100%" alt="Email Banner" style={{ marginBottom: "20px" }} />}
          
          {/* Dynamically Insert Subject */}
          <Heading>{subject}</Heading>
          
          {/* Dynamically Insert Message */}
          <Text>{message}</Text>

          {/* Dynamically Insert Button */}
          {buttonText && buttonUrl && (
            <Button href={buttonUrl} style={{
              background: "#e11d48",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "5px",
              textDecoration: "none",
              display: "inline-block",
              marginTop: "20px",
            }}>
              {buttonText}
            </Button>
          )}
        </Container>
      </Body>
    </Html>
  );
}
