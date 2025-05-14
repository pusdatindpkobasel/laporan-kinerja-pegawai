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
    Swal.fire("Belum Implementasi", "Proses submit belum dihubungkan ke backend.", "info");
    // Langkah selanjutnya: proses validasi, encode file, kirim via fetch ke GAS
  });
});
