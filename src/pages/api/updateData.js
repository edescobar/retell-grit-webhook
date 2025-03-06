import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function stripHTML(html) {
  return html.replace(/<[^>]+>/g, "").trim();
}

async function insertData(jsonData) {
  const { _id, overview, services } = jsonData;
  if (!_id || !overview || !services) {
    throw new Error("Missing required fields (_id, overview, services).");
  }

  const { name, addresses, number, website, email } = overview;

  for (const service of services) {
    const { pricing, protocols, options } = service;
    if (!options?.name) {
      throw new Error("Missing service name in one of the services.");
    }

    // Clean up pricing info
    const pricingInfo = (pricing || []).map((p) => {
      if (p.infoChart) {
        p.infoChart = p.infoChart.map((chart) => {
          const title =
            typeof chart.title === "string"
              ? stripHTML(chart.title)
              : chart.title;
          let content = chart.content;
          if (typeof content === "string") {
            content = stripHTML(content);
          }
          return { ...chart, title, content };
        });
      }
      return p;
    });

    // Clean up protocol info
    const protocolInfo = protocols?.schedule || {};
    if (protocolInfo.timeframes) {
      protocolInfo.timeframes = protocolInfo.timeframes.map((tf) => {
        if (typeof tf.content === "string") {
          tf.content = stripHTML(tf.content);
        }
        return tf;
      });
    }

    // Insert into Supabase
    const { error } = await supabase.from("partner_services").insert([
      {
        partner_id: _id,
        name,
        address: (addresses || []).join("; "),
        number,
        website,
        email,
        service_name: options.name,
        service_enabled: options.enabled,
        pricing_info: pricingInfo,
        protocol_info: protocolInfo,
      },
    ]);

    if (error) {
      throw new Error(`Supabase insertion error: ${error.message}`);
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Missing 'url' in request body." });
  }

  try {
    // Fetch data from the given URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Fetch error: ${response.status} - ${response.statusText}`
      );
    }

    // Parse JSON
    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new Error(`Invalid JSON response: ${err.message}`);
    }

    // Insert data
    await insertData(data);

    return res.status(200).json({ message: "Data inserted successfully" });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: error.message });
  }
}
