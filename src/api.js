export async function generate(description, signal){
    const res = await fetch("api/generate", {
        method : 'POST',
        headers : {'Content-Type' : 'application/json'},
        body : JSON.stringify({tripDescription : description}),
        signal,
    });

    if(!res.ok) throw new Error("Request Failed");
    return res.json();
}