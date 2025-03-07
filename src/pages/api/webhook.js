import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  console.log("Incoming request with method:", req.method);

  if (req.method === "POST") {
    const payload = req.body;
    console.log("Received payload:", JSON.stringify(payload));

    if (payload.event === "call_analyzed") {
      console.log("Processing 'call_analyzed' event");

      const {
        call: {
          call_id,
          call_status,
          start_timestamp,
          end_timestamp,
          duration_ms,
          transcript,
          recording_url,
          disconnection_reason, // Nuevo: disconnection reason
          from_number, // Nuevo: número de teléfono origen
          to_number, // Nuevo: número de teléfono destino
          call_analysis: {
            call_summary = "N/A",
            user_sentiment = "N/A",
            call_successful = false, // Usamos este campo en lugar de call_status
            custom_analysis_data: {
              customer_name = "N/A",
              email_address = "N/A",
              target_pest = "N/A",
              scheduled_time = "N/A",
              user_phone_number = "N/A", // Número de teléfono del usuario
              user_address = "N/A",
              call_type = "N/A",
            } = {},
          } = {},
        },
        call_cost: { combined_cost = "N/A" } = {},
      } = payload;

      // Convertir timestamps a fecha y hora legibles
      const startTime = new Date(start_timestamp).toLocaleString();
      const duration = `${Math.floor(duration_ms / 60000)} mins ${(
        (duration_ms % 60000) /
        1000
      ).toFixed(0)} secs`;

      // Contenido del email con los cambios:
      // 1. Se muestran los 3 números de teléfono: from_number, to_number y user_phone_number.
      // 2. Se agrega la disconnection_reason.
      // 3. Se usa call_successful del análisis para determinar si la llamada fue exitosa.
      const emailContent = `
        <h1>Call Analysis Report</h1>
        <p><strong>Date & Time:</strong> ${startTime}</p>
        <p><strong>Call ID:</strong> ${call_id}</p>
        <p><strong>Campaign Name:</strong> Eco Pest Control</p>
        <p><strong>Customer Name:</strong> ${customer_name}</p>
        <p><strong>From Phone:</strong> ${from_number}</p>
        <p><strong>To Phone:</strong> ${to_number}</p>
        <p><strong>User Phone Number:</strong> ${user_phone_number}</p>
        <p><strong>Email:</strong> ${email_address}</p>
        <p><strong>Address:</strong> ${user_address}</p>
        <p><strong>Target Pest:</strong> ${target_pest}</p>
        <p><strong>Scheduled Date & Time:</strong> ${scheduled_time}</p>
        <p><strong>Duration:</strong> ${duration}</p>
        <p><strong>Cost:</strong> $${combined_cost}</p>
        <p><strong>Call Status:</strong> ${call_status}</p>
        <p><strong>Ticket Type:</strong> ${call_type}</p>
        <p><strong>Call Summary:</strong> ${call_summary}</p>
        <p><strong>User Sentiment:</strong> ${user_sentiment}</p>
        <p><strong>Call Successful:</strong> ${
          call_successful ? "Yes" : "No"
        }</p>
        <p><strong>Disconnection Reason:</strong> ${disconnection_reason}</p>
        <p><strong>Transcript:</strong></p>
        <pre>${transcript}</pre>
        <p><strong>Recording:</strong> <a href="${recording_url}">Download</a></p>
      `;

      try {
        await resend.emails.send({
          from: "partner_va@gritppo.com",
          to: [
            "sofia.etchepare@sidetool.co",
            "evy@gritppo.com",
            "santiago@sidetool.co",
            "eco_pest_control_va@gritppo.com",
          ],
          subject: "Call Analysis Report for Eco Pest Control",
          html: emailContent,
        });

        console.log("Email sent successfully");
      } catch (error) {
        console.error("Error sending email:", error);
      }
    } else {
      console.log("Unhandled event type:", payload.event);
    }

    res.status(200).send("Webhook processed");
  } else {
    console.log("Invalid request method:", req.method);
    res.status(404).send("Not Found");
  }
}
