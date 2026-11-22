const $ = id => document.getElementById(id);
let vehicles = [];
let setupMode = false;
async function api(url, options={}) {
  const res = await fetch(url, {headers:{"Content-Type":"application/json"}, ...options});
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
function showError(message){$("authError").textContent=message;}
function formObject(form){return Object.fromEntries(new FormData(form).entries());}
async function init(){
  const status=await api("/api/admin/status");
  if(status.signedIn){await openDashboard();return;}
  setupMode=status.setupRequired;
  $("authTitle").textContent=setupMode?"Create your owner account":"Admin sign in";
  $("authHelp").textContent=setupMode?"First-time setup: create a private username and a strong password.":"Sign in to update your website.";
  $("authButton").textContent=setupMode?"Create admin account":"Sign in";
  $("password").autocomplete=setupMode?"new-password":"current-password";
  $("authHint").textContent=setupMode?"Use at least 10 characters for your password. Keep it private.":"Only the website owner should sign in here.";
}
$("authForm").addEventListener("submit",async e=>{
  e.preventDefault();showError("");
  try{
    await api(setupMode?"/api/admin/setup":"/api/admin/login",{method:"POST",body:JSON.stringify({username:$("username").value,password:$("password").value})});
    await openDashboard();
  }catch(err){showError(err.message);}
});
async function openDashboard(){
  $("auth").hidden=true;$("dashboard").hidden=false;
  const data=await api("/api/admin/data");vehicles=data.vehicles;
  const form=$("settingsForm");
  for(const [k,v] of Object.entries(data.settings)) if(form.elements[k]) form.elements[k].value=v;
  renderVehicles();
}
$("logout").onclick=async()=>{await api("/api/admin/logout",{method:"POST"});location.reload();};
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));
  $("companyTab").hidden=b.dataset.tab!=="company";
  $("vehiclesTab").hidden=b.dataset.tab!=="vehicles";
});
$("settingsForm").onsubmit=async e=>{
  e.preventDefault();$("settingsStatus").textContent="";
  try{await api("/api/admin/settings",{method:"PUT",body:JSON.stringify(formObject(e.target))});$("settingsStatus").textContent="Saved! Public website updated.";}
  catch(err){$("settingsStatus").textContent=err.message;}
};
function renderVehicles(){
  const list=$("vehicleList");list.innerHTML="";
  if(!vehicles.length){list.textContent="No vehicles added yet. Click Add vehicle to begin.";return;}
  vehicles.forEach(v=>{
    const row=document.createElement("div");row.className="vehicle-row";
    const info=document.createElement("div");const title=document.createElement("strong");title.textContent=v.name;
    const detail=document.createElement("p");detail.textContent=`${v.seats||"?"} seats · ${v.rate||"Rate not set"} per KM · Minimum ${v.min_km||"not set"} KM`;
    info.append(title,detail);
    const actions=document.createElement("div");actions.className="row-actions";
    const edit=document.createElement("button");edit.className="edit";edit.textContent="Edit";edit.onclick=()=>editVehicle(v);
    const del=document.createElement("button");del.className="delete";del.textContent="Delete";del.onclick=()=>deleteVehicle(v);
    actions.append(edit,del);row.append(info,actions);list.append(row);
  });
}
function editVehicle(v){
  const f=$("vehicleForm");f.reset();f.elements.id.value=v?.id||"";
  for(const key of ["name","seats","ac","rate","min_km","driver_bata","image","notes"])f.elements[key].value=v?.[key]||"";
  $("editorTitle").textContent=v?"Edit vehicle":"Add vehicle";$("vehicleEditor").hidden=false;
  $("vehicleStatus").textContent="";$("vehicleEditor").scrollIntoView({behavior:"smooth"});
}
$("addVehicle").onclick=()=>editVehicle(null);
$("cancelEdit").onclick=()=>$("vehicleEditor").hidden=true;
$("vehicleForm").onsubmit=async e=>{
  e.preventDefault();const f=e.target;const v=formObject(f);const id=v.id;delete v.id;
  try{
    await api(id?`/api/admin/vehicles/${id}`:"/api/admin/vehicles",{method:id?"PUT":"POST",body:JSON.stringify(v)});
    vehicles=(await api("/api/admin/data")).vehicles;renderVehicles();$("vehicleEditor").hidden=true;
  }catch(err){$("vehicleStatus").textContent=err.message;}
};
async function deleteVehicle(v){
  if(!confirm(`Delete ${v.name}?`))return;
  try{await api(`/api/admin/vehicles/${v.id}`,{method:"DELETE"});vehicles=(await api("/api/admin/data")).vehicles;renderVehicles();}
  catch(err){alert(err.message);}
}
init().catch(err=>showError(err.message));
