const API_BASE = 'https://script.google.com/macros/s/AKfycbypvQcZK4ZOekcuV8C-L5Qmci-RSRuN6jGkITBtU96U0RWa1VoIlayZN0Im1Cm6t6kV/exec';

document.addEventListener('DOMContentLoaded', async () => {
  const namaSelect = document.getElementById('nama');
  const pegawaiData = await fetch(`${API_BASE}?action=getPegawai`).then(res => res.json());

  pegawaiData.forEach(row => {
    const option = document.createElement('option');
    option.value = row[0];
    option.textContent = row[0];
    namaSelect.appendChild(option);
  });

  namaSelect.addEventListener('change', () => {
    const selected = pegawaiData.find(p => p[0] === namaSelect.value);
    if (selected) {
      document.getElementById('nip').textContent = selected[2];
      document.getElementById('subbid').textContent = selected[3];
      document.getElementById('status').textContent = selected[4];
      document.getElementById('golongan').textContent = selected[5];
      document.getElementById('jabatan').textContent = selected[6];
      document.getElementById('detailPegawai').style.display = 'block';
    }
  });

  const sesiContainer = document.getElementById('sesiContainer');
  for (let i = 1; i <= 7; i++) {
    sesiContainer.innerHTML += `
      <div class="mb-3">
        <label class="form-label">Sesi ${i}</label>
        <input type="text" class="form-control" id="sesi${i}" placeholder="Uraian kegiatan">
        <input type="file" class="form-control mt-1" id="bukti${i}">
      </div>`;
  }

  document.getElementById('laporanForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('laporanForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nama = document.getElementById('nama').value;
  if (!nama) {
    Swal.fire("Error", "Silakan pilih nama pegawai.", "error");
    return;
  }

  const pegawai = pegawaiData.find(p => p[0] === nama);
  const payload = {
    nama: pegawai[0],
    nip: pegawai[2],
    subbid: pegawai[3],
    status: pegawai[4],
    golongan: pegawai[5],
    jabatan: pegawai[6]
  };

  for (let i = 1; i <= 7; i++) {
    payload[`sesi${i}`] = document.getElementById(`sesi${i}`).value || '';
    const fileInput = document.getElementById(`bukti${i}`);
    if (fileInput.files.length > 0) {
      const base64 = await toBase64(fileInput.files[0]);
      payload[`bukti${i}`] = {
        name: fileInput.files[0].name,
        content: base64
      };
    } else {
      payload[`bukti${i}`] = null;
    }
  }

  Swal.fire({
    title: 'Mengirim...',
    didOpen: () => Swal.showLoading(),
    allowOutsideClick: false
  });

  fetch(`${API_BASE}?action=submitForm`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(res => {
    Swal.close();
    if (res.success) {
      Swal.fire("Berhasil!", "Laporan berhasil dikirim.", "success");
      document.getElementById('laporanForm').reset();
      document.getElementById("detailPegawai").style.display = 'none';
    } else {
      Swal.fire("Gagal", res.message || "Terjadi kesalahan.", "error");
    }
  })
  .catch(err => {
    Swal.fire("Error", err.message, "error");
  });
});

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

    // Langkah selanjutnya: proses validasi, encode file, kirim via fetch ke GAS
  });
});
