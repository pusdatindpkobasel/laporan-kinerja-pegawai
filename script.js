const API_URL = 'https://script.google.com/macros/s/AKfycbzfgAqb3G9XQ4ye3hfp8q_ionpXG8OWj1caXK5HVg2g8uZaY9u3JJCGX_8msYFlN22M/exec';

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
