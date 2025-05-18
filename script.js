const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyUC0sNeyxFMxT9ax4XPq96dHjePen5sCkf5WjQq29vGsme0T6wmO1MYJO_51tat2ZE7g/exec'; 

let pegawaiList = [], userData = {}, sesiStatus = {};

window.onload = () => {
  fetch(`${WEB_APP_URL}?action=getPegawai&callback=handlePegawai`)
    .then(res => res.text())
    .then(eval)
    .catch(err => Swal.fire('Error', 'Gagal memuat data pegawai', 'error'));

  // Cek userData di localStorage
  const savedUser = localStorage.getItem('userData');
  if (savedUser) {
    userData = JSON.parse(savedUser);

    // Tunggu sampai pegawaiList sudah terisi oleh handlePegawai
    const intervalId = setInterval(() => {
      if (pegawaiList.length > 0) {
        clearInterval(intervalId);

        // Set dropdown nama sesuai user yang login
        const namaSelect = document.getElementById("nama");
        namaSelect.value = userData.nama;
        namaSelect.disabled = true;

        // Disable input PIN
        document.getElementById("pin").disabled = true;

        // Set info pegawai di UI
        document.getElementById("nip").textContent = userData.nip;
        document.getElementById("subbid").textContent = userData.subbid;
        document.getElementById("status").textContent = userData.status;
        document.getElementById("golongan").textContent = userData.golongan;
        document.getElementById("jabatan").textContent = userData.jabatan;

        // Tampilkan form
        document.getElementById("form-wrapper").style.display = "block";

        setLogoutButton();
        loadSesiStatus();
      }
    }, 100);
  }

  // Listener enter di input PIN (selalu aktif)
  document.getElementById('pin').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      login();
    }
  });
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
function showRemainingTime() {
  const now = new Date();
  const closeTime = new Date();
  closeTime.setHours(22, 0, 0, 0); // jam 22:00:00

  if (now >= closeTime) {
    Swal.fire({
      icon: 'info',
      title: 'Waktu Pengisian Telah Berakhir',
      text: 'Form pengisian sudah ditutup sampai jam 8 pagi besok.'
    });
    // kamu juga bisa disable form di sini kalau mau
    return;
  }

  const diffMs = closeTime - now;
  const diffH = Math.floor(diffMs / 3600000); // jam
  const diffM = Math.floor((diffMs % 3600000) / 60000); // menit

  Swal.fire({
    icon: 'info',
    title: 'Sisa Waktu Pengisian',
    text: `Anda memiliki waktu ${diffH} jam ${diffM} menit untuk mengisi form hari ini.`
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
  localStorage.setItem('userData', JSON.stringify(userData));

  document.getElementById("nip").textContent = userData.nip;
  document.getElementById("subbid").textContent = userData.subbid;
  document.getElementById("status").textContent = userData.status;
  document.getElementById("golongan").textContent = userData.golongan;
  document.getElementById("jabatan").textContent = userData.jabatan;
  document.getElementById("form-wrapper").style.display = "block";
  
  setLogoutButton();
  document.getElementById("nama").disabled = true;
  document.getElementById("pin").disabled = true;

  showRemainingTime(); // Panggil fungsi notifikasi sisa waktu di sini
  loadSesiStatus();
}

function logout() {
   localStorage.removeItem('userData');
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
        ${sudah ? `
          <div class="alert alert-success p-2">
            ✅ Sudah dikirim: ${sudah}
            ${bukti ? `<br><a href="${bukti}" target="_blank">📎 Lihat Bukti</a>` : ""}
            <br><small class="text-muted">Isian sesi tidak bisa diedit ulang.</small>
          </div>
        ` : `
          <textarea id="sesi${i}" class="form-control mb-2" placeholder="Uraian pekerjaan sesi ${i}"></textarea>
          <input type="file" id="file${i}" class="form-control mb-2" accept=".jpg,.jpeg,.png,.pdf" />
          <button class="btn btn-success" onclick="submitSesi(${i})">Kirim Sesi ${i}</button>
        `}
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
  if (!pekerjaan || !file) return; // Nonaktifkan alert "Isi uraian & pilih file"
  
  if (file.size > 2 * 1024 * 1024) {
    return Swal.fire("File terlalu besar", "Maksimal ukuran file 2MB", "warning");
  }
  
  const allowedExt = ['pdf', 'jpg', 'jpeg', 'png'];
  const ext = file.name.split('.').pop().toLowerCase();
  if (!allowedExt.includes(ext)) {
    return Swal.fire("File tidak diizinkan", "Hanya PDF, JPG, JPEG, PNG", "warning");
  }
  const submitBtn = document.querySelector(`#submit-btn-${i}`); // pastikan ada id untuk tombol
  submitBtn.disabled = true;
  Swal.fire({ title: "Mengirim...", didOpen: () => Swal.showLoading() });
  submitBtn.disabled = false;
  
  const reader = new FileReader();
  reader.onload = async function () {
    const base64 = reader.result;
    const filename = `${userData.nama}_Sesi${i}_${new Date().toISOString().split("T")[0]}.${ext}`;

    // Upload file pakai FormData tanpa set content-type manual
    const formDataUpload = new FormData();
    formDataUpload.append('action', 'uploadFile');
    formDataUpload.append('filename', filename);
    formDataUpload.append('base64', base64);

    const uploadRes = await fetch(WEB_APP_URL, {
      method: 'POST',
      body: formDataUpload
    });
    const uploadData = await uploadRes.json();

    if (!uploadData.success) {
      Swal.fire("Gagal", "Upload file gagal: " + uploadData.message, "error");
      return;
    }

    // Submit form data juga dengan FormData
    const formDataSubmit = new FormData();
    formDataSubmit.append('action', 'submitForm');
    formDataSubmit.append('nama', userData.nama);
    formDataSubmit.append('nip', userData.nip);
    formDataSubmit.append('subbid', userData.subbid);
    formDataSubmit.append('status', userData.status);
    formDataSubmit.append('golongan', userData.golongan);
    formDataSubmit.append('jabatan', userData.jabatan);
    formDataSubmit.append('sesiKey', `sesi${i}`);
    formDataSubmit.append('buktiKey', `bukti${i}`);
    formDataSubmit.append('sesiVal', pekerjaan);
    formDataSubmit.append('buktiVal', uploadData.url);

    const submitRes = await fetch(WEB_APP_URL, {
      method: 'POST',
      body: formDataSubmit
    });
    const result = await submitRes.json();

    if (result.success) {
      Swal.fire("Berhasil", "Sesi berhasil dikirim", "success");
      loadSesiStatus();
    } else {
      Swal.fire("Gagal", "Terjadi kesalahan: " + (result.message || ""), "error");
    }
  };
  reader.readAsDataURL(file);
}
