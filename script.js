const API_URL = "https://script.google.com/macros/s/AKfycbx1MP5LvvNiPsp1zQFkZ75Zm0AZUwZw14D_R8BVDnajTF7SDTCqTenLteoMxfXEreQy/exec";

document.addEventListener("DOMContentLoaded", async () => {
  await loadPegawai();
  setupSesiFields();
});

async function loadPegawai() {
  const response = await fetch(`${API_URL}?action=getPegawai`);
  const data = await response.json();
  const select = document.getElementById("nama");
  data.forEach(row => {
    const option = document.createElement("option");
    option.value = row[0];
    option.textContent = row[0];
    select.appendChild(option);
  });
  window.dataPegawai = data;
}

document.getElementById("nama").addEventListener("change", () => {
  const nama = document.getElementById("nama").value;
  const data = window.dataPegawai.find(row => row[0] === nama);
  if (data) {
    document.getElementById("nip").textContent = data[2];
    document.getElementById("subbid").textContent = data[3];
    document.getElementById("status").textContent = data[4];
    document.getElementById("golongan").textContent = data[5];
    document.getElementById("jabatan").textContent = data[6];
    document.getElementById("detailPegawai").style.display = "block";
  }
});

function setupSesiFields() {
  const sesiContainer = document.getElementById("sesiContainer");
  for (let i = 1; i <= 7; i++) {
    const div = document.createElement("div");
    div.className = "mb-3";
    div.innerHTML = `
      <label class="form-label">Sesi ${i}</label>
      <input type="text" id="sesi${i}" class="form-control mb-1" placeholder="Uraian kegiatan">
      <input type="file" id="bukti${i}" class="form-control" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx">
    `;
    sesiContainer.appendChild(div);
  }
}

document.getElementById("btnSubmit").addEventListener("click", async () => {
  const nama = document.getElementById("nama").value;
  if (!nama) return alert("Pilih nama terlebih dahulu.");

  const pegawai = window.dataPegawai.find(row => row[0] === nama);
  const data = {
    nama: pegawai[0],
    nip: pegawai[2],
    subbid: pegawai[3],
    status: pegawai[4],
    golongan: pegawai[5],
    jabatan: pegawai[6]
  };

  for (let i = 1; i <= 7; i++) {
    data[`sesi${i}`] = document.getElementById(`sesi${i}`).value;
    const fileInput = document.getElementById(`bukti${i}`);
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const base64 = await toBase64(file);
      const upload = await fetch(`${API_URL}?action=uploadFile`, {
        method: "POST",
        body: JSON.stringify({ base64, filename: file.name })
      });
      const fileUrl = await upload.text();
      data[`bukti${i}`] = fileUrl;
    } else {
      data[`bukti${i}`] = "";
    }
  }

  const submit = await fetch(`${API_URL}?action=submitForm`, {
    method: "POST",
    body: JSON.stringify(data)
  });

  if (submit.ok) {
    alert("Laporan berhasil dikirim!");
    location.reload();
  } else {
    alert("Gagal mengirim laporan.");
  }
});

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
