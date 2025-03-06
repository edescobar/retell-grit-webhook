export default function handler(req, res) {
  if (req.method === "POST") {
    console.log("Received:", req.body);
    res.status(200).json(req.body);
  } else {
    res.status(404).send("Not Found");
  }
}
