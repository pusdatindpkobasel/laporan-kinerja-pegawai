const API_URL = 'https://script.google.com/macros/s/AKfycbzqCB1UjuTaEwS8mJeIq8BcRIX5Y4kfCB5jQs73G52_VmU0OBBmsJ8xsWXKvPCPiZqi/exec';

document.addEventListener("DOMContentLoaded", () => {
  fetch(`${API_URL}?action=getPegawai`)
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("nama");
      data.forEach(pegawai => {
        const opt = document.createElement("option");
        opt.value = pegawai.nama;
        opt.textContent = pegawai.nama;
        select.appendChild(opt);
      });

      document.getElementById("nama").addEventListener("change", () => {
        const selected = data.find(p => p.nama === select.value);
        if (selected) {
          document.getElementById("detailPegawai").style.display = "block";
          document.getElementById("nip").textContent = selected.nip;
          document.getElementById("subbid").textContent = selected.subbid;
          document.getElementById("status").textContent = selected.status;
          document.getElementById("golongan").textContent = selected.golongan;
          document.getElementById("jabatan").textContent = selected.jabatan;
        }
      });

      // Buat input sesi dan bukti
      const sesiDiv = document.getElementById("sesiContainer");
      for (let i = 1; i <= 7; i++) {
        sesiDiv.innerHTML += `
          <label>Sesi ${i}</label>
          <input type="text" class="form-control mb-1" id="sesi${i}">
          <input type="file" class="form-control mb-3" id="bukti${i}" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx">
        `;
      }

    });
});
document.getElementById("laporanForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nama = document.getElementById("nama").value;
  if (!nama) {
    Swal.fire("Error", "Silakan pilih nama pegawai.", "error");
    return;
  }

  const data = {
    nama,
    nip: document.getElementById("nip").textContent,
    subbid: document.getElementById("subbid").textContent,
    status: document.getElementById("status").textContent,
    golongan: document.getElementById("golongan").textContent,
    jabatan: document.getElementById("jabatan").textContent,
  };

  for (let i = 1; i <= 7; i++) {
    data[`sesi${i}`] = document.getElementById(`sesi${i}`).value;
    const fileInput = document.getElementById(`bukti${i}`);
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const base64 = await toBase64(file);
      const uploadRes = await fetch(`${API_URL}?action=uploadFileBase64`, {
        method: "POST",
        body: JSON.stringify({ fileName: file.name, base64 }),
        headers: { "Content-Type": "application/json" },
      });
      const resJson = await uploadRes.json();
      data[`bukti${i}`] = resJson.url || "";
    } else {
      data[`bukti${i}`] = "";
    }
  }

  // Kirim data laporan
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        Swal.fire("Berhasil!", "Laporan berhasil dikirim!", "success");
        document.getElementById("laporanForm").reset();
        document.getElementById("detailPegawai").style.display = "none";
      } else {
        Swal.fire("Gagal", "Terjadi kesalahan saat mengirim data.", "error");
      }
    });
});

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () =>

