const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyUC0sNeyxFMxT9ax4XPq96dHjePen5sCkf5WjQq29vGsme0T6wmO1MYJO_51tat2ZE7g/exec';

let pegawaiData = [];
let loggedInPegawai = null;
let sesiStatus = {}; // Untuk tandai sesi mana yang sudah submit

document.addEventListener("DOMContentLoaded", () => {
  fetch(`${WEB_APP_URL}?action=getPegawai&callback=loadPegawai`);
});

function loadPegawai(data) {
  pegawaiData = data;
  const select = document.getElementById("nama");
  select.innerHTML = '<option value="">Pilih Nama</option>';
  data.forEach(row => {
    const option = document.createElement("option");
    option.value = row[0];
    option.textContent = row[0];
    select.appendChild(option);
  });
}

function login() {
  const nama = document.getElementById("nama").value;
  const pin = document.getElementById("pin").value;
  const found = pegawaiData.find(row => row[0] === nama && row[7] === pin);
  if (!found) {
    Swal.fire("Gagal", "Nama atau PIN salah!", "error");
    return;
  }

  loggedInPegawai = {
    nama: found[0],
    email: found[1],
    nip: found[2],
    subbid: found[3],
    status: found[4],
    golongan: found[5],
    jabatan: found[6]
  };

  document.getElementById("nip").textContent = found[2];
  document.getElementById("subbid").textContent = found[3];
  document.getElementById("status").textContent = found[4];
  document.getElementById("gol").textContent = found[5];
  document.getElementById("jabatan").textContent = found[6];

  document.getElementById("form-wrapper").style.display = "block";

  fetchLaporanHariIni(found[0]);
}

function fetchLaporanHariIni(nama) {
  fetch(`${WEB_APP_URL}?action=checkLaporan&nama=${encodeURIComponent(nama)}`)
    .then(res => res.json())
    .then(res => {
      if (res.submitted) {
        sesiStatus = res.data;
      } else {
        sesiStatus = {};
      }
      renderSesiForm();
    });
}

function renderSesiForm() {
  const container = document.getElementById("sesi-form");
  container.innerHTML = "";

  for (let i = 1; i <= 7; i++) {
    const sesiKey = `sesi${i}`;
    const buktiKey = `bukti${i}`;
    const sudahSubmit = sesiStatus[sesiKey] && sesiStatus[buktiKey];

    const card = document.createElement("div");
    card.className = "card mb-3";

    const cardBody = document.createElement("div");
    cardBody.className = "card-body";

    const label = document.createElement("label");
    label.className = "form-label fw-bold";
    label.textContent = `Sesi ${i}`;

    const input = document.createElement("input");
    input.className = "form-control mb-2";
    input.type = "text";
    input.placeholder = "Uraian pekerjaan sesi ini";
    input.id = `sesi${i}`;
    input.disabled = sudahSubmit;

    const file = document.createElement("input");
    file.className = "form-control mb-2";
    file.type = "file";
    file.id = `bukti${i}`;
    file.accept = "image/*,application/pdf,.doc,.docx,.xls,.xlsx";
    file.disabled = sudahSubmit;

    const btn = document.createElement("button");
    btn.className = `btn btn-${sudahSubmit ? "success" : "primary"}`;
    btn.innerHTML = sudahSubmit ? "✅ Terkirim" : "Kirim Sesi";
    btn.disabled = sudahSubmit;
    btn.onclick = () => handleSubmit(i);

    cardBody.appendChild(label);
    cardBody.appendChild(input);
    cardBody.appendChild(file);
    cardBody.appendChild(btn);
    card.appendChild(cardBody);
    container.appendChild(card);
  }
}

async function handleSubmit(sesiNum) {
  const input = document.getElementById(`sesi${sesiNum}`);
  const file = document.getElementById(`bukti${sesiNum}`);
  const pekerjaan = input.value.trim();

  if (!pekerjaan) {
    Swal.fire("Kosong", "Mohon isi uraian pekerjaan.", "warning");
    return;
  }

  if (!file.files[0]) {
    Swal.fire("Kosong", "Mohon upload bukti dukung.", "warning");
    return;
  }

  Swal.showLoading();

  try {
    // Upload file ke Drive
    const base64 = await toBase64(file.files[0]);
    const uploadRes = await fetch(`${WEB_APP_URL}?action=uploadFile`, {
      method: "POST",
      body: JSON.stringify({
        filename: `${loggedInPegawai.nama}_Sesi${sesiNum}_${Date.now()}.${getExtension(file.files[0].name)}`,
        base64: base64
      }),
    });

    const fileUrl = await uploadRes.text();

    // Submit ke Sheet
    const payload = {
      nama: loggedInPegawai.nama,
      nip: loggedInPegawai.nip,
      subbid: loggedInPegawai.subbid,
      status: loggedInPegawai.status,
      golongan: loggedInPegawai.golongan,
      jabatan: loggedInPegawai.jabatan
    };
    payload[`sesi${sesiNum}`] = pekerjaan;
    payload[`bukti${sesiNum}`] = fileUrl;

    const resSubmit = await fetch(`${WEB_APP_URL}?action=submitForm`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const resultText = await resSubmit.text();
    if (resultText === "OK") {
      Swal.fire("Sukses", `Sesi ${sesiNum} berhasil disimpan.`, "success");
      sesiStatus[`sesi${sesiNum}`] = pekerjaan;
      sesiStatus[`bukti${sesiNum}`] = fileUrl;
      renderSesiForm();
    } else if (resultText === "DI_LUAR_JAM") {
      Swal.fire("Ditolak", "Pengisian hanya diizinkan pukul 08:00–22:00", "error");
    } else if (resultText === "HARI_LIBUR") {
      Swal.fire("Ditolak", "Hanya bisa mengisi pada hari kerja (Senin–Jumat)", "error");
    } else {
      Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan data.", "error");
    }
  } catch (err) {
    Swal.fire("Error", "Gagal mengirim laporan: " + err.message, "error");
  }
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}

function getExtension(filename) {
  return filename.split('.').pop();
}
