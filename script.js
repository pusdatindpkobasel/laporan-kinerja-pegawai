const API_URL = "https://script.google.com/macros/s/AKfycbxmcKOoipdBgqEUP4SIYy1dYM9RwJM2ienC0c6_orbbykUo6oY0p8gB-gyGIuStb8ZeZQ/exec";
let dataPegawai = [];
let sesiStatus = Array(7).fill(false); // Status tiap sesi
let currentUser = null;

// Load data pegawai saat awal
window.onload = async () => {
  try {
    await loadPegawai();
  } catch (e) {
    console.error("Gagal load data pegawai:", e);
    Swal.fire("Gagal!", "Tidak bisa memuat data pegawai. Periksa koneksi atau backend.", "error");
  }
};

// Ambil data pegawai dari backend
async function loadPegawai() {
  return new Promise((resolve, reject) => {
    const callbackName = "cb_" + Date.now();
    window[callbackName] = (data) => {
      dataPegawai = data;
      const select = document.getElementById("nama");
      select.innerHTML = `<option value="">-- Pilih --</option>`;
      data.forEach(row => {
        select.innerHTML += `<option value="${row[0]}">${row[0]}</option>`;
      });
      delete window[callbackName];
      resolve();
    };

    const script = document.createElement('script');
    script.src = `${API_URL}?action=getPegawai&callback=${callbackName}`;
    script.onerror = () => {
      reject(new Error("Gagal load data pegawai (script error)"));
      delete window[callbackName];
      script.remove();
    };
    document.body.appendChild(script);
  });
}

// Login berdasarkan nama + PIN
function login() {
  const nama = document.getElementById("nama").value;
  const pin = document.getElementById("pin").value.trim();

  if (!nama || !pin) {
    Swal.fire("Lengkapi", "Nama dan PIN wajib diisi", "warning");
    return;
  }

  const row = dataPegawai.find(r => r[0] === nama);
  if (!row || row[7] !== pin) {
    Swal.fire("Gagal", "PIN salah atau tidak ditemukan", "error");
    return;
  }

  currentUser = {
    nama: row[0],
    nip: row[1],
    subbid: row[2],
    status: row[3],
    golongan: row[4],
    jabatan: row[5]
  };

  // Tampilkan identitas
  document.getElementById("nip").textContent = row[1];
  document.getElementById("subbid").textContent = row[2];
  document.getElementById("status").textContent = row[3];
  document.getElementById("gol").textContent = row[4];
  document.getElementById("jabatan").textContent = row[5];

  document.getElementById("form-wrapper").style.display = "block";
  checkLaporanSebelumnya();
}

// Cek laporan yang sudah pernah diisi hari ini
async function checkLaporanSebelumnya() {
  const res = await fetch(`${API_URL}?action=checkLaporan&nama=${encodeURIComponent(currentUser.nama)}`);
  const json = await res.json();
  const formContainer = document.getElementById("sesi-form");
  formContainer.innerHTML = "";

  for (let i = 1; i <= 7; i++) {
    const sesi = document.createElement("div");
    sesi.className = "card mb-3";
    sesi.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">Sesi ${i}</h5>
        <div class="mb-2">
          <label>Nama Pekerjaan</label>
          <input type="text" id="sesi${i}_text" class="form-control">
        </div>
        <div class="mb-2">
          <label>Upload Bukti</label>
          <input type="file" id="sesi${i}_file" class="form-control">
        </div>
        <button class="btn btn-success" id="btn_sesi${i}" onclick="submitSesi(${i})">Submit</button>
        <span id="loading_sesi${i}" class="spinner" style="display:none"></span>
      </div>
    `;
    formContainer.appendChild(sesi);
  }

  if (json.submitted) {
    // disable semua tombol submit
    for (let i = 1; i <= 7; i++) {
      const row = dataPegawai.find(r => r[0] === currentUser.nama);
      if (row) markSesiSubmitted(i);
    }
  }
}

// Submit sesi tertentu
async function submitSesi(i) {
  const text = document.getElementById(`sesi${i}_text`).value.trim();
  const fileInput = document.getElementById(`sesi${i}_file`);
  const button = document.getElementById(`btn_sesi${i}`);
  const loading = document.getElementById(`loading_sesi${i}`);

  if (!text || fileInput.files.length === 0) {
    Swal.fire("Lengkapi", "Isi nama pekerjaan dan upload bukti untuk sesi " + i, "warning");
    return;
  }

  button.disabled = true;
  loading.style.display = "inline-block";

  try {
    // Upload file ke Drive
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      const uploadRes = await fetch(API_URL + "?action=uploadFile", {
        method: "POST",
        body: JSON.stringify({
          filename: `${currentUser.nama}_Sesi${i}_${new Date().toISOString()}`,
          base64
        }),
        headers: { "Content-Type": "application/json" }
      });
      const fileUrl = await uploadRes.text();

      // Submit data ke spreadsheet
      const payload = {
        nama: currentUser.nama,
        nip: currentUser.nip,
        subbid: currentUser.subbid,
        status: currentUser.status,
        golongan: currentUser.golongan,
        jabatan: currentUser.jabatan,
        [`sesi${i}`]: text,
        [`bukti${i}`]: fileUrl
      };

      const res = await fetch(API_URL + "?action=submitForm", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      });

      const result = await res.text();
      if (result === "OK" || result === "DUPLICATE") {
        markSesiSubmitted(i);
        Swal.fire("Berhasil", "Sesi " + i + " telah disimpan", "success");
      } else if (result === "HARI_LIBUR") {
        Swal.fire("Hari Libur", "Laporan hanya bisa diisi hari kerja (Senin–Jumat)", "info");
      } else if (result === "DI_LUAR_JAM") {
        Swal.fire("Di Luar Jam", "Pengisian hanya bisa antara jam 08.00–22.00", "info");
      } else {
        throw new Error(result);
      }
    };
    reader.readAsDataURL(file);
  } catch (err) {
    console.error("Submit error:", err);
    Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan sesi", "error");
  } finally {
    loading.style.display = "none";
  }
}

function markSesiSubmitted(i) {
  const btn = document.getElementById(`btn_sesi${i}`);
  btn.innerHTML = "✔️ Sudah Disubmit";
  btn.disabled = true;
  sesiStatus[i - 1] = true;
}
