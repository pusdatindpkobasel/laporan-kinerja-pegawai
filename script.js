const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyUC0sNeyxFMxT9ax4XPq96dHjePen5sCkf5WjQq29vGsme0T6wmO1MYJO_51tat2ZE7g/exec';

let dataPegawai = [];
let userAktif = null;
let statusLaporan = {};

// Load daftar nama saat halaman siap
window.onload = function () {
  fetch(`${WEB_APP_URL}?action=getPegawai&callback=loadNama`)
    .then(res => res.text())
    .then(eval);
};

// Callback untuk isi dropdown nama
function loadNama(data) {
  dataPegawai = data;
  const select = document.getElementById("nama");
  select.innerHTML = `<option value="">-- Pilih Pegawai --</option>`;
  data.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d[0];
    opt.textContent = d[0];
    select.appendChild(opt);
  });
}

// Fungsi login
function login() {
  const nama = document.getElementById("nama").value;
  const pin = document.getElementById("pin").value;
  if (!nama || !pin) return Swal.fire("Lengkapi data login!");

  const data = dataPegawai.find(d => d[0] === nama);
  if (!data || data[7] !== pin) return Swal.fire("PIN salah!");

  userAktif = {
    nama: data[0],
    nip: data[1],
    subbid: data[3],
    status: data[4],
    golongan: data[5],
    jabatan: data[6]
  };

  document.getElementById("nip").textContent = userAktif.nip;
  document.getElementById("subbid").textContent = userAktif.subbid;
  document.getElementById("status").textContent = userAktif.status;
  document.getElementById("gol").textContent = userAktif.golongan;
  document.getElementById("jabatan").textContent = userAktif.jabatan;
  document.getElementById("form-wrapper").style.display = "block";

  checkExistingLaporan();
}

// Cek laporan hari ini
function checkExistingLaporan() {
  fetch(`${WEB_APP_URL}?action=checkLaporan&nama=${encodeURIComponent(userAktif.nama)}`)
    .then(res => res.json())
    .then(data => {
      statusLaporan = data.data || {};
      tampilkanFormSesi();
    });
}

// Tampilkan form sesi
function tampilkanFormSesi() {
  const div = document.getElementById("sesi-form");
  div.innerHTML = "";

  for (let i = 1; i <= 7; i++) {
    const sudah = statusLaporan[`sesi${i}`];
    const isian = `
      <div class="card mb-3">
        <div class="card-header">Sesi ${i}</div>
        <div class="card-body">
          ${sudah ? `
            <p><strong>Sudah diisi.</strong></p>
            <p>Pekerjaan: ${sudah.pekerjaan}</p>
            <p><a href="${sudah.bukti}" target="_blank">Lihat Bukti</a></p>
          ` : `
            <div class="mb-2">
              <label>Nama Pekerjaan</label>
              <input type="text" class="form-control" id="pekerjaan${i}" />
            </div>
            <div class="mb-2">
              <label>Upload Bukti (jpg/png/pdf/doc/xls)</label>
              <input type="file" class="form-control" id="bukti${i}" />
            </div>
            <button class="btn btn-primary" onclick="submitSesi(${i})">Submit Sesi ${i}</button>
          `}
        </div>
      </div>`;
    div.innerHTML += isian;
  }
}

// Submit data sesi ke server
function submitSesi(i) {
  const pekerjaan = document.getElementById(`pekerjaan${i}`).value;
  const fileInput = document.getElementById(`bukti${i}`);
  if (!pekerjaan || !fileInput.files[0]) return Swal.fire("Lengkapi pekerjaan dan bukti sesi!");

  Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  const reader = new FileReader();
  reader.onload = function () {
    const base64 = reader.result;
    const filename = `${userAktif.nama}-Sesi${i}-${Date.now()}.${fileInput.files[0].name.split('.').pop()}`;
    const uploadData = {
      action: "uploadFile",
      base64: base64,
      filename: filename
    };

    fetch(WEB_APP_URL + "?action=uploadFile", {
      method: "POST",
      body: JSON.stringify(uploadData),
      headers: { "Content-Type": "application/json" }
    })
    .then(res => res.text())
    .then(fileUrl => {
      const laporan = {
        nama: userAktif.nama,
        nip: userAktif.nip,
        subbid: userAktif.subbid,
        status: userAktif.status,
        golongan: userAktif.golongan,
        jabatan: userAktif.jabatan,
        [`sesi${i}`]: pekerjaan,
        [`bukti${i}`]: fileUrl
      };

      return fetch(WEB_APP_URL + "?action=submitForm", {
        method: "POST",
        body: JSON.stringify(laporan),
        headers: { "Content-Type": "application/json" }
      });
    })
    .then(res => res.text())
    .then(res => {
      if (res === "OK") {
        Swal.fire("Sesi berhasil disimpan!");
        checkExistingLaporan();
      } else if (res === "HARI_LIBUR") {
        Swal.fire("Hari ini bukan hari kerja!");
      } else if (res === "DI_LUAR_JAM") {
        Swal.fire("Form hanya bisa diisi pukul 08:00 - 22:00");
      } else {
        Swal.fire("Gagal menyimpan sesi!");
      }
    });
  };
  reader.readAsDataURL(fileInput.files[0]);
}
