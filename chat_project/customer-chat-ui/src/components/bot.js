export function generate_response(user_input) 
{
  // Basic keyword-based response logic
  if (user_input.toLowerCase().includes('help')) 
  {
    return "I'm here to help! Could you please elaborate?";
  } 
  else if (user_input.toLowerCase().includes('price')) 
  {
    return "Our services are priced competitively. Let me know which service you're interested in.";
  } 
  else if (user_input.toLowerCase().includes('hello')) 
  {
    return "Hello! How can I assist you today?";
  } 
  else 
  {
    return "I'm sorry, I didn't quite understand that. Could you rephrase?";
  }
}
