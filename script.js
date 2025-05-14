const API_URL = "https://script.google.com/macros/s/AKfycbx1MP5LvvNiPsp1zQFkZ75Zm0AZUwZw14D_R8BVDnajTF7SDTCqTenLteoMxfXEreQy/exec";

document.addEventListener("DOMContentLoaded", async () => {
  await loadPegawai();  // Memuat data pegawai
  setupSesiFields();    // Menyiapkan form untuk sesi
});

async function loadPegawai() {
  const response = await fetch(`${API_URL}?action=getPegawai`);
  const data = await response.json();
  
  // Mengisi dropdown dengan nama pegawai
  const select = document.getElementById("nama");
  data.forEach(row => {
    const option = document.createElement("option");
    option.value = row[0];  // Nama pegawai di index pertama
    option.textContent = row[0];
    select.appendChild(option);
  });
  window.dataPegawai = data;  // Menyimpan data pegawai di global window object
}

// Menangani perubahan pada dropdown nama pegawai
document.getElementById("nama").addEventListener("change", () => {
  const nama = document.getElementById("nama").value;
  const data = window.dataPegawai.find(row => row[0] === nama);  // Mencari data pegawai berdasarkan nama
  if (data) {
    document.getElementById("nip").textContent = data[2];       // NIP di kolom ke-3
    document.getElementById("subbid").textContent = data[3];    // Sub Bidang di kolom ke-4
    document.getElementById("status").textContent = data[4];    // Status di kolom ke-5
    document.getElementById("golongan").textContent = data[5];  // Golongan di kolom ke-6
    document.getElementById("jabatan").textContent = data[6];   // Jabatan di kolom ke-7
    document.getElementById("detailPegawai").style.display = "block"; // Menampilkan detail pegawai
  }
});

// Menyiapkan input untuk sesi 1-7
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

// Menangani submit form
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

  // Menangani input sesi dan bukti (file)
  for (let i = 1; i <= 7; i++) {
    data[`sesi${i}`] = document.getElementById(`sesi${i}`).value;
    const fileInput = document.getElementById(`bukti${i}`);
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const base64 = await toBase64(file); // Mengubah file ke Base64
      const upload = await fetch(`${API_URL}?action=uploadFile`, {
        method: "POST",
        body: JSON.stringify({ base64, filename: file.name })
      });
      const fileUrl = await upload.text();
      data[`bukti${i}`] = fileUrl;  // Menyimpan URL file upload
    } else {
      data[`bukti${i}`] = "";
    }
  }

  // Mengirim data form ke server
  const submit = await fetch(`${API_URL}?action=submitForm`, {
    method: "POST",
    body: JSON.stringify(data)
  });

  // Menangani respon dari server
  if (submit.ok) {
    alert("Laporan berhasil dikirim!");
    location.reload();
  } else {
    alert("Gagal mengirim laporan.");
  }
});

// Fungsi untuk mengubah file menjadi Base64
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
