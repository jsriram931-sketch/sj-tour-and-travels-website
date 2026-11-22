let siteData;
const $ = id => document.getElementById(id);
function waLink(number, message="") {
  const clean = String(number || "").replace(/\D/g, "");
  return clean ? `https://wa.me/${clean}?text=${encodeURIComponent(message)}` : "#";
}
function vehicleMessage(v) {
  return `Hello ${siteData.settings.company_name}! I would like to enquire about ${v.name}. Please share availability and the full fare details.`;
}
function render(data) {
  siteData = data;
  const s = data.settings;
  $("brandName").textContent = s.company_name;
  $("heroTitle").innerHTML = `${escapeHtml(s.company_name)}<br><em>${escapeHtml(s.tagline)}</em>`;
  $("heroTagline").textContent = "Comfortable journeys. Reliable service.";
  $("aboutText").textContent = s.about;
  $("locationText").textContent = s.location;
  $("contactLocation").textContent = s.location;
  $("contactPhone").textContent = s.phone ? `Call: ${s.phone}` : "Add your company phone number in the admin panel.";
  $("footerText").textContent = s.footer;
  $("contactWhatsApp").href = waLink(s.whatsapp, `Hello ${s.company_name}, I have a travel enquiry.`);
  $("floatWhatsApp").href = waLink(s.whatsapp, `Hello ${s.company_name}, I have a travel enquiry.`);
  const grid = $("vehicles"), select = $("vehicleChoice");
  grid.innerHTML = ""; select.innerHTML = '<option value="">Choose a vehicle</option>';
  if (!data.vehicles.length) grid.innerHTML = '<div class="empty">Vehicle details will be added soon. Please contact us.</div>';
  data.vehicles.forEach(v => {
    const card = document.createElement("article");
    card.className = "vehicle-card";
    const img = document.createElement("img"); img.src = v.image || ""; img.alt = v.name;
    img.onerror = () => { img.style.display = "none"; };
    const body = document.createElement("div"); body.className = "vehicle-body";
    const h = document.createElement("h3"); h.textContent = v.name;
    const details = document.createElement("p"); details.textContent = `${v.seats ? v.seats + " seats" : "Seating details on request"} · ${v.ac || "AC details on request"}`;
    const rate = document.createElement("p"); rate.className = "rate"; rate.textContent = v.rate && v.rate !== "Add rate" ? `₹${v.rate} / km` : "Rate: Contact us";
    const min = document.createElement("p"); min.textContent = v.min_km ? `Minimum: ${v.min_km} km` : "";
    const bata = document.createElement("p"); bata.textContent = v.driver_bata ? `Driver bata: ${v.driver_bata}` : "";
    const note = document.createElement("p"); note.textContent = v.notes || "";
    const btn = document.createElement("a"); btn.className = "btn"; btn.textContent = "Enquire on WhatsApp"; btn.target = "_blank"; btn.rel = "noopener"; btn.href = waLink(s.whatsapp, vehicleMessage(v));
    body.append(h, details, rate, min, bata, note, btn); card.append(img, body); grid.append(card);
    const option = document.createElement("option"); option.value = v.name; option.textContent = v.name; select.append(option);
  });
}
function escapeHtml(value) { return String(value || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
$("bookingForm").addEventListener("submit", e => {
  e.preventDefault();
  const s = siteData.settings;
  const msg = `NEW TRAVEL ENQUIRY - ${s.company_name}\n\nName: ${$("customerName").value}\nCustomer mobile: ${$("customerPhone").value}\nVehicle: ${$("vehicleChoice").value}\nPickup: ${$("pickup").value}\nDestination: ${$("destination").value}\nTravel date: ${$("travelDate").value}\nApprox. KM: ${$("distance").value || "Not specified"}\nRequirements: ${$("requirements").value || "None"}\n\nPlease share availability and final fare.`;
  const link = waLink(s.whatsapp, msg);
  if (link === "#") return alert("The company WhatsApp number has not been added yet. Please contact the company.");
  window.open(link, "_blank", "noopener");
});
fetch("/api/public").then(r => r.json()).then(render).catch(() => alert("Could not load the website details. Please refresh."));
