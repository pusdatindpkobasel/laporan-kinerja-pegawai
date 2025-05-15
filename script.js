const API_URL = "https://script.google.com/macros/s/AKfycbzBTdqUxHjQ4czmQMEHU9UyeM9Wc5ijgQJeqF1vJpa4scnZODXuVE6aoCorZZnB_QnqQQ/exec";

let pegawaiData = [];
let currentUser = null;

async function fetchJSON(url) {
  const res = await fetch(url);
  return await res.json();
}

async function login() {
  const nama = document.getElementById("nama").value;
  const pin = document.getElementById("pin").value;

  const data = pegawaiData.find(p => p[0] === nama && p[7] === pin);
  if (!data) return Swal.fire("Gagal!", "PIN salah atau nama tidak cocok.", "error");

  currentUser = {
    nama: data[0], email: data[1], nip: data[2],
    subbid: data[3], status: data[4], gol: data[5], jabatan: data[6]
  };

  document.getElementById("nip").innerText = currentUser.nip;
  document.getElementById("subbid").innerText = currentUser.subbid;
  document.getElementById("status").innerText = currentUser.status;
  document.getElementById("gol").innerText = currentUser.gol;
  document.getElementById("jabatan").innerText = currentUser.jabatan;
  document.getElementById("biodata").classList.remove("d-none");

  loadForm();
}

async function loadForm() {
  const res = await fetchJSON(`${API_URL}?action=getStatus&nama=${encodeURIComponent(currentUser.nama)}`);
  const sesiData = res.found ? res.sesi : Array(14).fill("");

  const container = document.getElementById("sesi-form");
  container.innerHTML = "";
  container.classList.remove("d-none");

  for (let i = 1; i <= 7; i++) {
    const pekerjaan = sesiData[(i - 1) * 2];
    const bukti = sesiData[(i - 1) * 2 + 1];
    const id = `sesi${i}`;

    const row = document.createElement("div");
    row.className = "card mb-3";
    row.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">Sesi ${i}</h5>
        <input id="${id}_pekerjaan" class="form-control mb-2" placeholder="Nama Pekerjaan" ${pekerjaan ? "disabled value='"+pekerjaan+"'" : ""}>
        <input id="${id}_bukti" type="file" class="form-control mb-2" ${bukti ? "disabled" : ""}>
        ${
          bukti ?
          `<a href="${bukti}" target="_blank" class="btn btn-success disabled">✔ Sudah Submit</a>` :
          `<button class="btn btn-primary" onclick="submitSesi(${i})">Submit</button>`
        }
      </div>
    `;
    container.appendChild(row);
  }
}

async function submitSesi(sesi) {
  const pekerjaan = document.getElementById(`sesi${sesi}_pekerjaan`).value;
  const file = document.getElementById(`sesi${sesi}_bukti`).files[0];
  if (!pekerjaan || !file) return Swal.fire("Lengkapi!", "Pekerjaan dan bukti harus diisi", "warning");

  Swal.fire({ title: "Mengupload...", didOpen: () => Swal.showLoading(), allowOutsideClick: false });

  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = reader.result;
    const uploadRes = await fetch(`${API_URL}?action=uploadFile`, {
      method: "POST",
      body: JSON.stringify({ base64, filename: file.name })
    });
    const fileUrl = await uploadRes.text();

    const submitRes = await fetch(`${API_URL}?action=submitSesi`, {
      method: "POST",
      body: JSON.stringify({
        sesi, pekerjaan, bukti: fileUrl,
        ...currentUser
      })
    });
    const result = await submitRes.text();

    Swal.close();
    if (result === "OK") {
      Swal.fire("Sukses!", "Sesi berhasil disimpan.", "success");
      loadForm();
    } else if (result === "SUDAH_ISI") {
      Swal.fire("Gagal!", "Sesi sudah pernah diisi.", "error");
    } else {
      Swal.fire("Gagal!", "Terjadi kesalahan: " + result, "error");
    }
  };
  reader.readAsDataURL(file);
}

window.onload = async () => {
  try {
    pegawaiData = await fetchJSON(`${API_URL}?action=getPegawai`);
    const namaSelect = document.getElementById("nama");
    pegawaiData.forEach(p => {
      const opt = document.createElement("option");
      opt.text = p[0]; opt.value = p[0];
      namaSelect.add(opt);
    });
  } catch {
    Swal.fire("Gagal", "Gagal load data pegawai.", "error");
  }
};
