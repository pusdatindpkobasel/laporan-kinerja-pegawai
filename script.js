const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyUC0sNeyxFMxT9ax4XPq96dHjePen5sCkf5WjQq29vGsme0T6wmO1MYJO_51tat2ZE7g/exec'; 

let pegawaiList = [], userData = {}, sesiStatus = {};

window.onload = () => {
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

function renderSesiForm() {
  const wrapper = document.getElementById("sesi-form");
  wrapper.innerHTML = "";
  for (let i = 1; i <= 7; i++) {
    const sudah = sesiStatus[`sesi${i}`];
    const bukti = sesiStatus[`bukti${i}`];
    const div = document.createElement("div");
    div.className = "card card-sesi";
    div.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">Sesi ${i}</h5>
        ${sudah ? `
          <div class="alert alert-success p-2">
            ✅ Sudah dikirim: ${sudah}
            ${bukti ? `<br><a href="${bukti}" target="_blank">📎 Lihat Bukti</a>` : ""}
            <br><small class="text-muted">Isian sesi tidak bisa diedit ulang.</small>
          </div>
        ` : `
          <textarea id="sesi${i}" class="form-control mb-2" placeholder="Uraian pekerjaan sesi ${i}">${sudah || ""}</textarea>
          <input type="file" id="file${i}" class="form-control mb-2" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx" />
          <button class="btn btn-success" onclick="submitSesi(${i})">Kirim Sesi ${i}</button>
        `}
      </div>
    `;
    wrapper.appendChild(div);
  }
}

async function submitSesi(i) {
  const pekerjaan = document.getElementById(`sesi${i}`).value.trim();
  const file = document.getElementById(`file${i}`).files[0];
  if (!pekerjaan || !file) return Swal.fire("Lengkapi", "Isi uraian & pilih file", "warning");

  Swal.fire({ title: "Mengirim...", didOpen: () => Swal.showLoading() });

  const reader = new FileReader();
  reader.onload = async function () {
    const base64 = reader.result;
    const filename = `${userData.nama}_Sesi${i}_${new Date().toISOString().split("T")[0]}.${file.name.split('.').pop()}`;
    const uploadRes = await fetch(WEB_APP_URL + "?action=uploadFile", {
      method: "POST",
      body: JSON.stringify({ filename, base64 })
    });
    const fileUrl = await uploadRes.text();

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
