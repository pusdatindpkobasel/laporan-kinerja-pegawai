const API_URL = "https://script.google.com/macros/s/AKfycbwdeh5AbjveqE1uqNmaZfFur3fglO0srg82nQgIMQf5UDnJHZbSFH3OtEFYtnhbfaCCuQ/exec";

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
  } else {
    document.getElementById("detailPegawai").style.display = "none";
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

document.getElementById("laporanForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nama = document.getElementById("nama").value;
  if (!nama) {
    Swal.fire("Error", "Pilih nama terlebih dahulu.", "warning");
    return;
  }

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
    Swal.fire({
      icon: 'success',
      title: 'Laporan berhasil dikirim!',
      showConfirmButton: false,
      timer: 2000
    });

    // Reset form manual
    document.getElementById("laporanForm").reset();
    document.getElementById("detailPegawai").style.display = "none";

    const sesiFields = document.querySelectorAll("#sesiContainer input[type='text'], #sesiContainer input[type='file']");
    sesiFields.forEach(input => input.value = "");
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Gagal mengirim laporan.',
      text: 'Silakan coba lagi atau hubungi admin.'
    });
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
