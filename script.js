const API_URL = "https://script.google.com/macros/s/AKfycbxRZ2F0fZ0bRu8Lk6DGstJYM5YHDJPzZ57D_3MQfqsZsWN7fR3cJ0e9o_edtExI9ACsWg/exec";

let pegawai = [];
let currentUser = null;
let laporanHariIni = {};
let sudahKirimSesi = {};

document.addEventListener("DOMContentLoaded", () => {
  loadPegawai();
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  for (let i = 1; i <= 7; i++) {
    document.getElementById(`form-sesi${i}`).addEventListener("submit", e => handleSubmitSesi(e, i));
  }
});

function loadPegawai() {
  const script = document.createElement("script");
  script.src = `${API_URL}?action=getPegawai&callback=renderPegawai`;
  document.body.appendChild(script);
}

function renderPegawai(data) {
  pegawai = data;
  const select = document.getElementById("nama");
  select.innerHTML = '<option value="">Pilih Nama</option>';
  data.forEach(row => {
    const opt = document.createElement("option");
    opt.value = row[0];
    opt.textContent = row[0];
    select.appendChild(opt);
  });
}

function handleLogin(e) {
  e.preventDefault();
  const nama = document.getElementById("nama").value;
  const pin = document.getElementById("pin").value;
  const peg = pegawai.find(p => p[0] === nama && p[7] === pin);
  if (!peg) return alert("PIN salah");

  currentUser = {
    nama: peg[0], nip: peg[1], subbid: peg[2], status: peg[3],
    golongan: peg[4], jabatan: peg[5]
  };

  document.getElementById("loginArea").style.display = "none";
  document.getElementById("formArea").style.display = "block";

  cekLaporanHariIni(nama);
}

function cekLaporanHariIni(nama) {
  fetch(`${API_URL}?action=checkLaporan&nama=${encodeURIComponent(nama)}`)
    .then(res => res.json())
    .then(data => {
      // TODO: Jika ingin pre-load data sesi sebelumnya bisa dilanjutkan di sini
    });
}

async function handleSubmitSesi(e, sesi) {
  e.preventDefault();
  const input = document.getElementById(`input-sesi${sesi}`);
  const file = document.getElementById(`file-sesi${sesi}`);
  const pekerjaan = input.value.trim();
  const bukti = file.files[0];

  if (!pekerjaan) return alert("Isi nama pekerjaan");
  if (!bukti) return alert("Upload bukti dukung");

  showLoading(true);

  const base64 = await fileToBase64(bukti);
  const filename = `${currentUser.nama}-Sesi${sesi}-${new Date().toISOString().split("T")[0]}-${bukti.name}`;

  const uploadRes = await fetch(API_URL + "?action=uploadFile", {
    method: "POST",
    body: JSON.stringify({ filename, base64 })
  });

  const fileUrl = await uploadRes.text();

  const payload = {
    nama: currentUser.nama,
    nip: currentUser.nip,
    subbid: currentUser.subbid,
    status: currentUser.status,
    golongan: currentUser.golongan,
    jabatan: currentUser.jabatan,
  };
  payload[`sesi${sesi}`] = pekerjaan;
  payload[`bukti${sesi}`] = fileUrl;

  const submitRes = await fetch(API_URL + "?action=submitForm", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const text = await submitRes.text();
  showLoading(false);

  if (text === "OK") {
    document.getElementById(`form-sesi${sesi}`).innerHTML =
      `<div class="alert alert-success text-center">✔️ Terkirim</div>`;
  } else if (text === "DI_LUAR_JAM") {
    alert("Pengisian hanya diizinkan antara pukul 08:00 s/d 22:00");
  } else if (text === "HARI_LIBUR") {
    alert("Pengisian hanya di hari kerja (Senin s/d Jumat)");
  } else {
    alert("Gagal kirim laporan: " + text);
  }
}

function fileToBase64(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function showLoading(show) {
  const loading = document.getElementById("loading");
  loading.style.display = show ? "block" : "none";
}
