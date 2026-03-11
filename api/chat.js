export default async function handler(req, res) {

if (req.method !== "POST") {
return res.status(405).json({ reply: "Method not allowed" });
}

try {

const { message } = req.body;

const response = await fetch("https://openrouter.ai/api/v1/chat/completions",{
method:"POST",
headers:{
"Authorization":`Bearer ${process.env.OPENROUTER_API_KEY}`,
"Content-Type":"application/json"
},
body:JSON.stringify({
model:"mistralai/mistral-7b-instruct",
messages:[
{
role:"system",
content:"You are OceanGuard AI, a disaster management assistant helping with cyclones, floods, tsunamis and ocean hazards."
},
{
role:"user",
content:message
}
]
})
});

const data = await response.json();

if(!data.choices){
throw new Error("Invalid AI response");
}

res.status(200).json({
reply:data.choices[0].message.content
});

}catch(error){

console.error("AI Error:",error);

res.status(500).json({
reply:"AI service temporarily unavailable"
});

}

}