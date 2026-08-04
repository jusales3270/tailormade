import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type FaseDossie = {
  nome: string;
  trilho: string;
  concluidos: number;
  total: number;
  responsavelNome: string | null;
};

export type AtaDossie = {
  reuniaoCodigo: string;
  reuniaoTitulo: string;
  corpo: string;
  publicadaEm: string | null;
};

export type AssinaturaDossie = { membroNome: string; status: string; assinadoEm: string | null };

export type DocumentoDossie = {
  codigo: string;
  nome: string;
  status: string;
  critico: boolean;
  versao: number | null;
  assinaturas: AssinaturaDossie[];
};

export type DossieDados = {
  orgNome: string;
  geradoEm: string;
  fases: FaseDossie[];
  atas: AtaDossie[];
  documentos: DocumentoDossie[];
};

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#1c1c1e" },
  capa: { marginBottom: 24 },
  tituloCapa: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  subCapa: { fontSize: 10, color: "#6e6e73" },
  secao: { marginBottom: 18 },
  tituloSecao: { fontSize: 13, fontWeight: 700, marginBottom: 8, borderBottom: "1pt solid #d1d1d6", paddingBottom: 4 },
  linha: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottom: "0.5pt solid #ececec" },
  linhaTexto: { flex: 1 },
  linhaNota: { fontSize: 9, color: "#6e6e73", marginTop: 2 },
  ataBloco: { marginBottom: 10, paddingBottom: 8, borderBottom: "0.5pt solid #ececec" },
  ataTitulo: { fontSize: 10.5, fontWeight: 700 },
  ataCorpo: { fontSize: 9.5, marginTop: 3, lineHeight: 1.4 },
  vazio: { fontSize: 9.5, color: "#6e6e73", fontStyle: "italic" },
  assinaturaLinha: { fontSize: 9, color: "#3a3a3c" },
});

function SecaoTrilha({ fases }: { fases: FaseDossie[] }) {
  return (
    <View style={s.secao}>
      <Text style={s.tituloSecao}>Trilha</Text>
      {fases.length === 0 ? (
        <Text style={s.vazio}>Nenhuma fase registrada.</Text>
      ) : (
        fases.map((f, i) => (
          <View key={i} style={s.linha}>
            <View style={s.linhaTexto}>
              <Text>{f.nome} ({f.trilho})</Text>
              <Text style={s.linhaNota}>Responsável: {f.responsavelNome ?? "sem responsável"}</Text>
            </View>
            <Text>{f.concluidos} de {f.total}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function SecaoAtas({ atas }: { atas: AtaDossie[] }) {
  return (
    <View style={s.secao}>
      <Text style={s.tituloSecao}>Atas publicadas</Text>
      {atas.length === 0 ? (
        <Text style={s.vazio}>Nenhuma ata publicada.</Text>
      ) : (
        atas.map((a, i) => (
          <View key={i} style={s.ataBloco}>
            <Text style={s.ataTitulo}>
              {a.reuniaoCodigo} · {a.reuniaoTitulo}
            </Text>
            <Text style={s.linhaNota}>
              Publicada em: {a.publicadaEm ? new Date(a.publicadaEm).toLocaleString("pt-BR") : "—"}
            </Text>
            <Text style={s.ataCorpo}>{a.corpo}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function SecaoAssinaturas({ documentos }: { documentos: DocumentoDossie[] }) {
  return (
    <View style={s.secao}>
      <Text style={s.tituloSecao}>Documentos e assinaturas</Text>
      {documentos.length === 0 ? (
        <Text style={s.vazio}>Nenhum documento registrado.</Text>
      ) : (
        documentos.map((d, i) => (
          <View key={i} style={s.linha}>
            <View style={s.linhaTexto}>
              <Text>
                {d.codigo} · {d.nome} {d.critico ? "(crítico)" : ""}
              </Text>
              <Text style={s.linhaNota}>
                Status: {d.status} · versão: {d.versao ?? "sem versão"}
              </Text>
              {d.assinaturas.map((asn, k) => (
                <Text key={k} style={s.assinaturaLinha}>
                  {asn.membroNome}: {asn.status}
                  {asn.assinadoEm ? ` em ${new Date(asn.assinadoEm).toLocaleDateString("pt-BR")}` : ""}
                </Text>
              ))}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

export function DossiePdf({ dados }: { dados: DossieDados }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.capa}>
          <Text style={s.tituloCapa}>Dossiê de fundação — {dados.orgNome}</Text>
          <Text style={s.subCapa}>Gerado em {new Date(dados.geradoEm).toLocaleString("pt-BR")}</Text>
        </View>
        <SecaoTrilha fases={dados.fases} />
        <SecaoAtas atas={dados.atas} />
        <SecaoAssinaturas documentos={dados.documentos} />
      </Page>
    </Document>
  );
}
