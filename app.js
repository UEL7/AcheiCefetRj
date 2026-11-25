const CAMPI = ["Maracanã","Maria da Graça","Angra dos Reis","Itaguaí","Nova Friburgo","Nova Iguaçu","Petrópolis","Valença"];
const configured = window.SUPABASE_URL && window.SUPABASE_ANON_KEY &&
  !window.SUPABASE_URL.includes("COLE_AQUI") && !window.SUPABASE_ANON_KEY.includes("COLE_AQUI");
const db = configured ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;
let currentUser = null, items = [], creatingAccount = false;

const $ = (id) => document.getElementById(id);
const message = (text, error=false) => { $("message").textContent=text; $("message").style.background=error?"#fff0ed":"#edf2f8"; };
function setFeedback(id,text){$(id).textContent=text;}
function switchPanel(which){
  $("search-panel").classList.toggle("hidden",which!=="search");
  $("create-panel").classList.toggle("hidden",which!=="create");
  $("show-search").classList.toggle("active",which==="search");
  $("show-create").classList.toggle("active",which==="create");
}
$("show-search").onclick=()=>switchPanel("search");
$("show-create").onclick=()=>switchPanel("create");
$("campus-filter").onchange=loadItems;
$("category-filter").onchange=renderItems;
$("search-input").oninput=renderItems;

function updateAccount(){
  $("user-label").textContent=currentUser ? currentUser.email : "Visitante";
  $("auth-button").textContent=currentUser ? "Sair" : "Entrar";
}
$("auth-button").onclick=async()=>{
  if(currentUser){await db.auth.signOut();currentUser=null;updateAccount();await loadItems();}
  else {$("auth-dialog").showModal();}
};
$("close-auth").onclick=()=>$("auth-dialog").close();
$("toggle-auth").onclick=()=>{
  creatingAccount=!creatingAccount;
  $("auth-title").textContent=creatingAccount?"Criar conta":"Entrar";
  $("auth-description").textContent=creatingAccount?"Use um e-mail válido. O Supabase poderá pedir confirmação por e-mail.":"Entre para cadastrar e gerenciar seus anúncios.";
  $("auth-submit").textContent=creatingAccount?"Criar conta":"Entrar";
  $("toggle-auth").textContent=creatingAccount?"Já tenho conta. Entrar":"Ainda não tenho conta. Criar conta";
  $("auth-feedback").textContent="";
};
$("auth-form").onsubmit=async(e)=>{
  e.preventDefault(); if(!db)return;
  const data=new FormData(e.currentTarget), email=data.get("email"), password=data.get("password");
  setFeedback("auth-feedback","Aguarde...");
  const result=creatingAccount ? await db.auth.signUp({email,password}) : await db.auth.signInWithPassword({email,password});
  if(result.error){setFeedback("auth-feedback",result.error.message);return;}
  if(creatingAccount && !result.data.session){setFeedback("auth-feedback","Conta criada. Confira seu e-mail para confirmar o cadastro e depois entre.");return;}
  currentUser=result.data.user;updateAccount();$("auth-dialog").close();e.currentTarget.reset();await loadItems();
};

async function loadItems(){
  if(!db){message("Configure o Supabase no arquivo config.js para ativar o mural.",true);return;}
  message("Carregando anúncios…");
  let query=db.from("items").select("*").gt("expires_at",new Date().toISOString()).order("created_at",{ascending:false});
  const campus=$("campus-filter").value;if(campus)query=query.eq("campus",campus);
  const {data,error}=await query;
  if(error){message("Não foi possível carregar os anúncios: "+error.message,true);return;}
  items=data||[];renderItems();
  message(items.length ? "Confira os anúncios. Combine a devolução com cuidado." : "Nenhum anúncio encontrado com esses filtros.");
}
function renderItems(){
  const term=$("search-input").value.toLowerCase().trim(), category=$("category-filter").value;
  const filtered=items.filter(x=>(!category||x.category===category) &&
    [x.title,x.description,x.place,x.campus].join(" ").toLowerCase().includes(term));
  $("item-count").textContent=`${filtered.length} ${filtered.length===1?"anúncio":"anúncios"}`;
  $("items-grid").innerHTML="";
  filtered.forEach(item=>{
    const card=document.createElement("article");card.className="item-card";
    if(item.photo_url){const img=document.createElement("img");img.className="item-photo";img.src=item.photo_url;img.alt="Foto do objeto: "+item.title;card.append(img);}
    else {const ph=document.createElement("div");ph.className="photo-placeholder";ph.textContent="⌕";card.append(ph);}
    const body=document.createElement("div");body.className="item-body";
    const tag=document.createElement("span");tag.className="tag";tag.textContent=item.category;body.append(tag);
    const title=document.createElement("h3");title.textContent=item.title;body.append(title);
    const meta=document.createElement("div");meta.className="item-meta";meta.textContent=`${item.campus}${item.place?" · "+item.place:""} · ${new Date(item.created_at).toLocaleDateString("pt-BR")}`;body.append(meta);
    const desc=document.createElement("p");desc.className="item-desc";desc.textContent=item.description;body.append(desc);
    const contact=document.createElement("a");contact.className="contact";contact.textContent="Contato: "+item.contact;
    if(/^https?:\/\//i.test(item.contact))contact.href=item.contact;
    else contact.href="mailto:"+item.contact;
    if(contact.href)contact.target="_blank";body.append(contact);
    if(currentUser && currentUser.id===item.user_id){
      const actions=document.createElement("div");actions.className="owner-actions";
      const done=document.createElement("button");done.textContent="Marcar como resolvido";done.onclick=()=>removeItem(item.id);
      actions.append(done);body.append(actions);
    }
    card.append(body);$("items-grid").append(card);
  });
}
async function removeItem(id){
  if(!confirm("Confirma que o objeto foi devolvido? O anúncio será removido."))return;
  const {error}=await db.from("items").delete().eq("id",id);
  if(error){alert("Não foi possível remover: "+error.message);return;}
  await loadItems();
}
$("item-form").onsubmit=async(e)=>{
  e.preventDefault();
  if(!db){setFeedback("form-feedback","Configure o Supabase antes de publicar.");return;}
  if(!currentUser){$("auth-dialog").showModal();setFeedback("auth-feedback","Entre ou crie uma conta para publicar.");return;}
  const form=e.currentTarget, data=new FormData(form), file=data.get("photo");
  setFeedback("form-feedback","Publicando…");
  let photo_url=null;
  if(file && file.size){
    if(file.size>5*1024*1024){setFeedback("form-feedback","A imagem deve ter no máximo 5 MB.");return;}
    const ext=file.name.split(".").pop().toLowerCase(), path=`${currentUser.id}/${crypto.randomUUID()}.${ext}`;
    const upload=await db.storage.from("item-photos").upload(path,file,{upsert:false});
    if(upload.error){setFeedback("form-feedback","Erro ao enviar foto: "+upload.error.message);return;}
    photo_url=db.storage.from("item-photos").getPublicUrl(path).data.publicUrl;
  }
  const payload={title:data.get("title").trim(),campus:data.get("campus"),category:data.get("category"),
    place:data.get("place").trim(),description:data.get("description").trim(),contact:data.get("contact").trim(),photo_url,user_id:currentUser.id};
  const {error}=await db.from("items").insert(payload);
  if(error){setFeedback("form-feedback","Erro ao publicar: "+error.message);return;}
  form.reset();setFeedback("form-feedback","Anúncio publicado!");$("campus-filter").value=payload.campus;switchPanel("search");await loadItems();
};

async function init(){
  if(!db){updateAccount();message("O site está pronto visualmente. Falta conectar o banco Supabase (veja o passo a passo).",true);return;}
  const {data}=await db.auth.getSession();currentUser=data.session?.user||null;updateAccount();
  db.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;updateAccount();loadItems();});
  await loadItems();
}
init();
