const endpoint = 'https://script.google.com/macros/s/AKfycby2FcHl1reb_0DJUo1PeUrlhCdp1tjlBl89EM_CDQi3pcu6xTDEcyCGIGlV-xiBqTOFCw/exec';

let pegawaiData = [], pegawaiAktif = null;

document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch(`${endpoint}?action=getPegawai&callback=cb`);
  const text = await res.text();
  eval(text); // panggil callback
});

function cb(data) {
  pegawaiData = data;
  const select = document.getElementById("nama");
  select.innerHTML = '<option value="">Pilih Nama</option>';
  data.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d[0];
    opt.textContent = d[0];
    select.appendChild(opt);
  });
}

function login() {
  const nama = document.getElementById("nama").value;
  const pin = document.getElementById("pin").value.trim();
  const info = pegawaiData.find(d => d[0] === nama);
  if (!info || info[7] !== pin) {
    Swal.fire('Gagal', 'PIN salah atau nama tidak ditemukan', 'error');
    return;
  }

  pegawaiAktif = {
    nama: info[0], nip: info[2], subbid: info[3],
    status: info[4], golongan: info[5], jabatan: info[6]
  };

  document.getElementById("form-wrapper").style.display = "block";
  document.getElementById("nip").textContent = info[2];
  document.getElementById("subbid").textContent = info[3];
  document.getElementById("status").textContent = info[4];
  document.getElementById("golongan").textContent = info[5];
  document.getElementById("jabatan").textContent = info[6];

  renderSesiForm();
}

function renderSesiForm() {
  const sesiWrapper = document.getElementById("sesi-form");
  sesiWrapper.innerHTML = "";

  for (let i = 1; i <= 7; i++) {
    const div = document.createElement("div");
    div.className = "sesi-card";
    div.innerHTML = `
      <h6>Sesi ${i}</h6>
      <textarea class="form-control mb-2" id="sesi${i}" rows="2" placeholder="Uraian pekerjaan sesi ${i}"></textarea>
      <input type="file" class="form-control mb-2" id="bukti${i}" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" />
      <button class="btn btn-success" onclick="submitSesi(${i})" id="btn-sesi${i}">Submit</button>
    `;
    sesiWrapper.appendChild(div);
  }
}

async function submitSesi(n) {
  const jam = new Date().getHours();
  if (jam < 8 || jam >= 22) {
    Swal.fire("Diluar Waktu", "Form hanya bisa diisi antara pukul 08:00 - 22:00", "warning");
    return;
  }

  const textarea = document.getElementById(`sesi${n}`);
  const fileInput = document.getElementById(`bukti${n}`);
  const tombol = document.getElementById(`btn-sesi${n}`);

  if (!textarea.value.trim() || !fileInput.files.length) {
    Swal.fire("Lengkapi", "Isi uraian dan upload bukti terlebih dahulu", "info");
    return;
  }

  tombol.disabled = true;
  tombol.textContent = "Mengirim...";

  // Upload file ke Drive
  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = async function () {
    const base64 = reader.result;
    const uploadRes = await fetch(endpoint + "?action=uploadFile", {
      method: "POST",
      body: JSON.stringify({
        filename: `${pegawaiAktif.nama}-sesi${n}-${Date.now()}`,
        base64
      })
    });
    const fileUrl = await uploadRes.text();

    // Kirim data sesi
    const payload = {
      nama: pegawaiAktif.nama,
      nip: pegawaiAktif.nip,
      subbid: pegawaiAktif.subbid,
      status: pegawaiAktif.status,
      golongan: pegawaiAktif.golongan,
      jabatan: pegawaiAktif.jabatan,
    };
    payload[`sesi${n}`] = textarea.value.trim();
    payload[`bukti${n}`] = fileUrl;

    const res = await fetch(endpoint + "?action=submitForm", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const result = await res.text();
    if (result === "OK") {
      Swal.fire("Berhasil", "Sesi " + n + " berhasil disimpan", "success");
      tombol.classList.add("disabled");
      tombol.textContent = "✔";
      textarea.disabled = true;
      fileInput.disabled = true;
    } else if (result === "DI_LUAR_JAM") {
      Swal.fire("Waktu Tidak Valid", "Form hanya bisa diakses antara jam 08:00 - 22:00", "error");
    } else if (result === "HARI_LIBUR") {
      Swal.fire("Hari Libur", "Form hanya bisa diisi di hari kerja", "error");
    } else {
      Swal.fire("Error", result, "error");
    }
  };
  reader.readAsDataURL(file);
}
