const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyUC0sNeyxFMxT9ax4XPq96dHjePen5sCkf5WjQq29vGsme0T6wmO1MYJO_51tat2ZE7g/exec'; 

let pegawaiList = [], userData = {}, sesiStatus = {};
function autoLogin() {
  const data = localStorage.getItem("userData");
  const time = localStorage.getItem("loginTime");
  if (data && time) {
    const now = Date.now();
    const elapsed = now - parseInt(time); // selisih waktu dalam ms
    const oneDay = 1 * 60 * 60 * 1000; // 24 jam dalam ms

    if (elapsed < oneDay) {
      userData = JSON.parse(data);

      document.getElementById("nip").textContent = userData.nip;
      document.getElementById("subbid").textContent = userData.subbid;
      document.getElementById("status").textContent = userData.status;
      document.getElementById("golongan").textContent = userData.golongan;
      document.getElementById("jabatan").textContent = userData.jabatan;
      document.getElementById("form-wrapper").style.display = "block";

      document.getElementById("nama").value = userData.nama;
      document.getElementById("nama").disabled = true;
      document.getElementById("pin").disabled = true;

      setLogoutButton();
      loadSesiStatus();
    } else {
      // Waktu login habis, hapus data
      localStorage.removeItem("userData");
      localStorage.removeItem("loginTime");
    }
  }
}

window.onload = () => {
  autoLogin(); // <- tambahkan ini di awal

  fetch(`${WEB_APP_URL}?action=getPegawai&callback=handlePegawai`)
    .then(res => res.text())
    .then(eval)
    .catch(err => Swal.fire('Error', 'Gagal memuat data pegawai', 'error'));
};

function handlePegawai(data) {
  pegawaiList = data;
  const namaSelect = document.getElementById("nama");
  namaSelect.innerHTML = '<option value="">Pilih Nama</option>';
  data.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p[0];
    opt.textContent = p[0];
    namaSelect.appendChild(opt);
  });
}

function login() {
  const nama = document.getElementById("nama").value;
  const pin = document.getElementById("pin").value;
  const data = pegawaiList.find(p => p[0] === nama);
  if (!data || pin !== data[7]) return Swal.fire("Gagal", "PIN salah", "error");

  userData = {
    nama: data[0], nip: data[2], subbid: data[3],
    status: data[4], golongan: data[5], jabatan: data[6]
  };
  const loginTime = Date.now(); // waktu sekarang (ms sejak epoch)

localStorage.setItem("userData", JSON.stringify(userData));
localStorage.setItem("loginTime", loginTime.toString());
  
  document.getElementById("nip").textContent = userData.nip;
  document.getElementById("subbid").textContent = userData.subbid;
  document.getElementById("status").textContent = userData.status;
  document.getElementById("golongan").textContent = userData.golongan;
  document.getElementById("jabatan").textContent = userData.jabatan;
  document.getElementById("form-wrapper").style.display = "block";
  
  setLogoutButton();
  // Disable form login setelah login sukses
  document.getElementById("nama").disabled = true;
  document.getElementById("pin").disabled = true;
  loadSesiStatus();
}

function logout() {
   // Enable form login kembali saat logout
  document.getElementById("nama").disabled = false;
  document.getElementById("pin").disabled = false;
  document.getElementById("pin").value = "";
  document.getElementById("form-wrapper").style.display = "none";
  localStorage.removeItem("userData");
  localStorage.removeItem("loginTime");
  userData = {};
  sesiStatus = {};

  const loginBtn = document.getElementById("login-button");
  loginBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-shield-lock" viewBox="0 0 16 16">
      <path d="M5.072 0a1.5 1.5 0 0 0-.832.252l-3 2A1.5 1.5 0 0 0 .5 3.5v3c0 4.418 3.582 8 8 8s8-3.582 8-8v-3a1.5 1.5 0 0 0-.74-1.276l-3-2A1.5 1.5 0 0 0 10.928 0H5.072z"/>
      <path d="M8 5a1 1 0 0 1 1 1v1.5a1 1 0 0 1-2 0V6a1 1 0 0 1 1-1z"/>
    </svg>
    Login
  `;
  loginBtn.classList.remove("btn-danger");
  loginBtn.classList.add("btn-dark");
  loginBtn.onclick = login;
}

function setLogoutButton() {
  const loginBtn = document.getElementById("login-button");
  loginBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-right" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M6 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-1 0v-9A.5.5 0 0 1 6 3z"/>
      <path fill-rule="evenodd" d="M11.854 8.354a.5.5 0 0 1 0-.708L13.207 6.293a.5.5 0 1 1 .707.707L12.707 8l1.207 1.207a.5.5 0 0 1-.707.707l-1.353-1.353z"/>
      <path fill-rule="evenodd" d="M4.5 8a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1h-8a.5.5 0 0 1-.5-.5z"/>
    </svg>
    Logout
  `;
  loginBtn.classList.remove("btn-dark");
  loginBtn.classList.add("btn-danger");
  loginBtn.onclick = logout;
}

function loadSesiStatus() {
  fetch(`${WEB_APP_URL}?action=getLaporan&nama=${userData.nama}`)
    .then(res => res.json())
    .then(data => {
      sesiStatus = data || {};
      renderSesiForm();
    });
}

function getJamSesi(i) {
  const jam = [
    "(07.30–08.30)", "(08.30–09.30)", "(09.30–10.30)", "(10.30–12.00)",
    "(13.00–14.00)", "(14.00–15.00)", "(15.00–16.00)"
  ];
  return jam[i - 1] || "";
}

function renderSesiForm() {
  const wrapper = document.getElementById("sesi-form");
  wrapper.innerHTML = "";

  let totalIsi = 0; // Untuk indikator kelengkapan

  for (let i = 1; i <= 7; i++) {
    const sudah = sesiStatus[`sesi${i}`];
    const bukti = sesiStatus[`bukti${i}`];
    const div = document.createElement("div");
    div.className = "card card-sesi mb-3";
    div.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">Sesi ${i} ${getJamSesi(i)}</h5>
       <textarea id="sesi${i}" class="form-control mb-2" placeholder="Uraian pekerjaan sesi ${i}" ${sudah ? "disabled" : ""}>${sudah || ""}</textarea>
<input type="file" id="file${i}" class="form-control mb-2" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx" ${sudah ? "disabled" : ""} />
<button class="btn ${sudah ? "btn-secondary" : "btn-success"}" ${sudah ? "disabled" : `onclick="submitSesi(${i})"`}>
  ${sudah ? `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-lock-fill me-1" viewBox="0 0 16 16">
      <path d="M8 1a3 3 0 0 0-3 3v3H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-1V4a3 3 0 0 0-3-3z"/>
    </svg> Terkunci
  ` : "Kirim Sesi " + i}
</button>
${sudah ? `
  <div class="alert alert-success mt-2 p-2">
    ✅ Sudah dikirim.
    ${bukti ? `<br><a href="${bukti}" target="_blank">📎 Lihat Bukti</a>` : ""}
    <br><small class="text-muted">Isian sesi tidak bisa diedit ulang.</small>
  </div>
` : ""}
      </div>
    `;
    if (sudah) totalIsi++;
    wrapper.appendChild(div);
  }

  // Indikator kelengkapan sesi
  const statusEl = document.getElementById("sesi-status");
  statusEl.innerHTML = `
    <div class="alert alert-info text-center">
      🔄 ${totalIsi} dari 7 sesi telah diisi
    </div>
  `;
}

async function submitSesi(i) {
  const pekerjaan = document.getElementById(`sesi${i}`).value.trim();
  const file = document.getElementById(`file${i}`).files[0];
  
  if (!pekerjaan || !file) return Swal.fire("Lengkapi", "Isi uraian & pilih file", "warning");
  if (file.size > 2 * 1024 * 1024) {
    return Swal.fire("File terlalu besar", "Maksimal ukuran file 2MB", "warning");
  }
  const allowedExt = ['pdf', 'jpg', 'jpeg', 'png'];
  const ext = file.name.split('.').pop().toLowerCase();
  if (!allowedExt.includes(ext)) {
    return Swal.fire("File tidak diizinkan", "Hanya PDF, JPG, JPEG, PNG", "warning");
  }
  Swal.fire({ title: "Mengirim...", didOpen: () => Swal.showLoading() });

  const reader = new FileReader();
  reader.onload = async function () {
    const base64 = reader.result;
    const filename = `${userData.nama}_Sesi${i}_${new Date().toISOString().split("T")[0]}.${file.name.split('.').pop()}`;
    const uploadRes = await fetch(WEB_APP_URL + "?action=uploadFile", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ filename, base64 })
});
const uploadResult = await uploadRes.json();
if (!uploadResult.success) {
  return Swal.fire("Gagal upload file", uploadResult.message || "Error", "error");
}
const fileUrl = uploadResult.url;

    const payload = {
      nama: userData.nama,
      nip: userData.nip,
      subbid: userData.subbid,
      status: userData.status,
      golongan: userData.golongan,
      jabatan: userData.jabatan,
      [`sesi${i}`]: pekerjaan,
      [`bukti${i}`]: fileUrl
    };

    const res = await fetch(WEB_APP_URL + "?action=submitForm", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});
const result = await res.text();

    if (result === "OK") {
      Swal.fire("Berhasil", "Sesi berhasil dikirim", "success");
      loadSesiStatus();
    } else if (result === "HARI_LIBUR") {
      Swal.fire("Ditolak", "Form hanya aktif Senin–Jumat", "error");
    } else if (result === "DI_LUAR_JAM") {
      Swal.fire("Ditolak", "Form hanya bisa diisi pukul 08.00–22.00", "error");
    } else {
      Swal.fire("Gagal", "Terjadi kesalahan", "error");
    }
  };
  reader.readAsDataURL(file);
}
