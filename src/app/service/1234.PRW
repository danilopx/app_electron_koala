<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/sistema/application/views/header.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/sistema/application/views/menu.php';
?>

<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
    <section class="content">
        <!-- Small boxes (Stat box) -->
        <div id="content">

            <div id="ajax-content">

                <div class="row">
                    <div class="col-md-12">
                        <div class="box box-primary">
                            <div class="box-header with-border">
                                <div class="col-md-11">
                                    <h3 class="box-title"><b>Apontamento de Produção Automático</b></h3>
                                </div>
                                <div class="col-md-1">
                                    <button type="submit" onclick="App.exit()" id="apont_sair"
                                        class="btn btn-block btn-danger btn-lg"><i
                                            class="fa fa-times txt-danger"></i></button>
                                </div>

                            </div>

                            <div class="box-body ">

                                <div id="row">
                                    <div id="apontamento_parcial" class="callout callout-danger" style="display: none">

                                        <p class="text-center" id="info_parcial"></p>
                                    </div>

                                </div>

                                <div class="col-md-12">
                                    <div class="row">

                                        <div class="row font20 ">
                                            <div class="col-md-4">
                                                <div class="table-responsive">
                                                    <table class="table">
                                                        <tbody>
                                                            <tr>
                                                                <th style="width:30%">Ordem:</th>
                                                                <td><span class="text-success" id="a"></span></td>
                                                            </tr>
                                                            <tr>
                                                                <th>Produto:</th>
                                                                <td><span class="text-success" id="b"></span></td>
                                                            </tr>
                                                            <tr>
                                                                <th>Quantidade:</th>
                                                                <td><span class="text-success" id="c"></span></td>
                                                            </tr>

                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="table-responsive">
                                                    <table class="table">
                                                        <tbody>
                                                            <tr>
                                                                <th style="width:30%">Data:</th>
                                                                <td><span class="text-success" id="d"></span></td>
                                                            </tr>
                                                            <tr>
                                                                <th>Descrição:</th>
                                                                <td><span class="text-success" id="e"></span></td>
                                                            </tr>
                                                            <tr>
                                                                <th>Mult. Caixa:</th>
                                                                <td><span class="text-success" id="f"></span></td>
                                                            </tr>

                                                        </tbody>
                                                    </table>
                                                </div>

                                            </div><!-- /.box-body -->
                                            <div class="col-md-2">
                                                <div class="table-responsive">
                                                    <table class="table">
                                                        <tbody>
                                                            <tr>
                                                                <th>AMZ:</th>
                                                                <td><span class="text-success" id="g"></td>
                                                            </tr>

                                                            <tr>
                                                                <th>UM:</th>
                                                                <td><span class="text-success" id="h"></td>
                                                            </tr>
                                                            <tr>
                                                                <th>Pacote:</th>
                                                                <td><span class="text-success" id="i"></td>
                                                            </tr>

                                                        </tbody>
                                                    </table>
                                                </div>

                                            </div><!-- /.box-body -->

                                        </div><!-- /.box-body -->

                                        <div class="row " id="div_valor">
                                            <div class="box-body ">

                                                <div class="col-md-5">
                                                    <strong class="text-center font20 with-border">Situação:</strong>
                                                    <span class="text-success font20" id="s"></span>

                                                    <div class="row" style="display:none ;" id="etqinfo">
                                                        <div class="col-md-12 table-responsive">
                                                            <table class="table no-margin">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Cód de Barras</th>
                                                                        <th>Quantidade</th>
                                                                        <th>Data</th>
                                                                        <th>Status</th>

                                                                    </tr>
                                                                </thead>
                                                                <tbody id="list_barcode">

                                                                </tbody>
                                                            </table>

                                                        </div>
                                                    </div>
                                                    <div class="row" style="display:none ;" id="etqapond">
                                                        <div class=" col-md-12 table-responsive overflow-auto p-3 mb-3 mb-md-0 mr-md-3 bg-light"
                                                            style="max-width: 100%; max-height: 400px;">
                                                            <table class="table no-margin ">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Quantidade</th>
                                                                        <th>Data</th>
                                                                        <th>Tempo de Producao</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody id="list_apont">
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-7  text-center font20 with-border">
                                                    <strong class="text-center pull-left font20 with-border">Tempo:
                                                        <span class="text-success" id="t"></strong>
                                                    <span class="text-success font20" id="s"></span>
                                                    <strong class="text-center pull-left font20 with-border"
                                                        style="margin-left: 50px;">Ciclo: <span class="text-success"
                                                            id="z"></span>

                                                        <button name="reset" onclick="DOM.reset()" id="reset"
                                                            style="z-index: 999999;" type="button"
                                                            class="btn btn-info btn-xs"><b>
                                                                <h4>Reset</h4>
                                                            </b></button> </strong>




                                                    <div class="pull-right">
                                                        <button name="acerto" onclick="Modal.openAcerto()" id="acerto"
                                                            type="button" class="btn btn-success"><b>
                                                                <h4>Acerto</h4>
                                                            </b></button>
                                                    </div>


                                                    <div style="padding-top: 90px; class=" col-md-12 text-center">
                                                        <span class="text-success font310" id="quantidade">0</span>
                                                        <span class="text-success font340 hidden" id="pacote">0</span>
                                                    </div>



                                                    <div class="col-md-12">


                                                        <button type="submit" id="apont_parcial"
                                                            onclick="Production.insertProducao('parcial')"
                                                            class="btn btn-block btn-success btn-lg pull-right"><i
                                                                class="fa fa-star-half-o  txt-danger"></i> Apontar
                                                            Produção
                                                        </button>


                                                    </div>

                                                </div>



                                            </div>
                                        </div><!-- /.box-body -->


                                        <div class="row font30">

                                            <div class="col-md-4">


                                                <table class="table">
                                                    <tbody>
                                                        <tr>
                                                            <th style="width:30%">Produção:</th>
                                                            <td> <span class="text-success" id="j"></span></td>
                                                        </tr>

                                                    </tbody>
                                                </table>
                                            </div>


                                            <div class="col-md-4">



                                                <table class="table">
                                                    <tbody>
                                                        <tr>
                                                            <th>Saldo:</th>
                                                            <td><span class="text-success" id="l"></span></td>
                                                        </tr>

                                                    </tbody>
                                                </table>

                                            </div>


                                            <div class="col-md-4">
                                                <table class="table">
                                                    <tbody>
                                                        <tr>
                                                            <th>N° Etiqueta:</th>
                                                            <td><span class="text-success" id="m"></span></td>
                                                        </tr>

                                                    </tbody>
                                                </table>


                                            </div>



                                        </div><!-- /.box-body -->


                                    </div><!-- /.box-body -->




                                </div><!-- /.box -->

                            </div>


                            <div class="box-footer ">

                                <div id="row">




                                    <div class="col-md-3">

                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

    </section><!-- /.content -->

</div>


<div class="modal-overlay_v2">
    <div class="modal_v2">

        <div class="boxed-group dangerzone modal_v2">

            <h3>Apontamento Automatico</h3>

            <div class="boxed-group-inner">
                <section id="search_loading">
                    <h4><i class="fa fa-barcode"></i> Scanear Código de barras da Ordem de Produção:</h4>

                    <input type="text" id="ordemProducao" name="ordemProducao" maxlength="11" value=""
                        placeholder="Ordem de produção" onkeyup="Production.setOrdem(this.value)"
                        class="span4_codbar" />


                </section>
            </div>
        </div>
    </div>
</div>

<div class="modal-overlay_v3">
    <div class="modal_v3">

        <div class="boxed-group dangerzone modal_v3">

            <h3><i class="fa fa-warning"></i> ATENÇÃO</h3>

            <div class="boxed-group-inner">
                <section>
                    <div id="row">
                        <p>Problema:</p>
                        <div id="content_problem" class="text-danger">
                        </div>
                        <p>Solução:</p>
                        <div id="content_solution" class="text-danger">

                        </div>
                    </div>
                    <div id="fooster_modal">
                        <button onclick="Modal.closeError()" class="btn btn-danger boxed-action"
                            id="delete-account">Fechar</button>
                    </div>
                </section>
            </div>
        </div>
    </div>
</div>



<div class="modal-overlay_v5">
    <div class="modal_v5">

        <div class="boxed-group dangerzone modal_v5">

            <h3><i class="fa fa-warning"></i> ATENÇÃO</h3>

            <div class="boxed-group-inner">
                <section>
                    <div id="row">

                        <div id="content_success_a" class="text-success">
                        </div>

                        <div id="content_success_b" class="text-success">

                        </div>
                    </div>
                    <div id="fooster_modal">

                    </div>
                </section>
            </div>
        </div>
    </div>
</div>




<div class="modal-overlay_v4">
    <div class="modal_v4">

        <div class="boxed-group dangerzone modal_v4">

            <h3><i class="fa fa-warning"></i> ATENÇÃO</h3>

            <div class="boxed-group-inner">
                <section>
                    <div id="row">
                        <h4><i class="fa fa-refresh"></i> Digite a Quantidade:</h4>

                        <input type="text" id="acertoQuant" name="acertoQuant" maxlength="4"
                            oninput="this.value = this.value.replace(/[^0-9.]/g, '');" class="span4_codbar" />
                    </div>
                    </br>
                    </br>
                    <div id="row">
                        <h4><i class="fa fa-refresh"></i> Digite a Tempo de Produção (Em Minutos)</h4>

                        <input type="text" id="acertoTempo" name="acertoTempo" maxlength="4"
                            oninput="this.value = this.value.replace(/[^0-9.]/g, '');" class="span4_codbar" />
                    </div>
                    </br>
                    </br>
                    <div id="fooster_modal">
                        <button onclick="Production.setAcerto()" class="btn btn-success boxed-action"
                            id="bt_acerto">Salvar</button>
                    </div>
                </section>
            </div>
        </div>
    </div>
</div>

<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/sistema/application/views/fooster.php';
?>

<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/3.0.4/socket.io.js"
  integrity="sha512-aMGMvNYu8Ue4G+fHa359jcPb1u+ytAF+P2SCb+PxrjCdO3n3ZTxJ30zuH39rimUggmTwmh2u7wvQsDTHESnmfQ=="
  crossorigin="anonymous"></script>

<script>
    let cont = 1
    let sinal_port = 0
    let flag_port = 0
    let idTimeout = '';
    let flag_Acerto = 0;
    let flag_ciclo = parseInt(0)
    let flag_apont = 0;
    let socket = null;
    let flag_socket = 0

    const Utils = {


        async removeAcento(text) {
            text = text.toLowerCase();
            text = text.replace(new RegExp('[ÁÀÂÃ]', 'gi'), 'a');
            text = text.replace(new RegExp('[ÉÈÊ]', 'gi'), 'e');
            text = text.replace(new RegExp('[ÍÌÎ]', 'gi'), 'i');
            text = text.replace(new RegExp('[ÓÒÔÕ]', 'gi'), 'o');
            text = text.replace(new RegExp('[ÚÙÛ]', 'gi'), 'u');
            text = text.replace(new RegExp('[Ç]', 'gi'), 'c');
            return text;
        },


        async timeDiffCalc(date, tempo) {

            var a = new Date(date);
            var minute = a.setMinutes(a.getMinutes() - tempo);
            var ts_ms = minute;
            var date_ob = new Date(ts_ms);
            var year = date_ob.getFullYear();
            var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
            var date = ("0" + date_ob.getDate()).slice(-2);
            var hours = ("0" + date_ob.getHours()).slice(-2);
            var minutes = ("0" + date_ob.getMinutes()).slice(-2);
            var seconds = ("0" + date_ob.getSeconds()).slice(-2);

            return year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;

        },


        async timeserver() {


            dataserver = ''
            const data = await fetch(`http://127.0.0.1:5000/api/v1/arotubi/timeserver`)
            if (data.status == 201 || data.status == 200) {
                time = await data.json()
                time.data.map(function (time, i) {

                    dataserver = time.DATE.split("T")
                    dataserver = dataserver[0] + ' ' + dataserver[1].substring(0, 5)
                })
            }

            return dataserver;


        },

        async calcTempoProd() {


            let dataserver = await Utils.timeserver();
            let getQuant = Production.getCount();

            let tempo = getQuant.tempo

            if (tempo == 0) {

                tempo = 1

            }

            data_ini = await Utils.timeDiffCalc(dataserver.replace(' ', 'T'), tempo)

            return dados = new Array(data_ini.replace(' ', 'T'), dataserver.replace(' ', 'T'), tempo)
        },


        formatPeso(value) {

            let ret = Utils.leftPad(parseInt(value.replace('.', '')), 6)
            return ret
        },
        leftPad(value, totalWidth, paddingChar) {
            var length = totalWidth - value.toString().length + 1;
            return Array(length).join(paddingChar || '0') + value;
        },
        formatDate(date) {
            const splittedDate = date.split(" ")
            const data = splittedDate[0].split('-')
            const hour = splittedDate[1]

            return `${data[2]}/${data[1]}/${data[0]} ${hour} `
        },
        clearTime() {

            for (i = 0; i < 1000; i++) {
                clearTimeout(i)
            }
        }

    }

    const Parameter = {

        async setParam() {
            const data = await fetch(`http://127.0.0.1:5000/api/v1/arotubi/parametros`)
            if (data.status == 201 || data.status == 200) {
                Storage.setDados("parametro", await data.json())
            }
        },
        getParam() {
            return Storage.getDados("parametro");
        }
    }

    const Modal = {
        openSearch() {
            document
                .querySelector('.modal-overlay_v2')
                .classList
                .add('active')
        },
        closeSearch() {
            // fechar o modal
            // remover a class active do modal
            document.querySelector('.modal-overlay_v2')
                .classList
                .remove('active')
        },
        openAcerto() {

            App.pause();

            document.getElementById('acertoQuant').value = 0
            document.getElementById('acertoTempo').value = 0

            document
                .querySelector('.modal-overlay_v4')
                .classList
                .add('active')

            DOM.focusConponente('acertoQuant')

            flag_Acerto = 1

        },
        closeAcerto() {
            // fechar o modal
            // remover a class active do modal
            document.querySelector('.modal-overlay_v4')
                .classList
                .remove('active')
            flag_Acerto = 0
        },

        loadingSearch() {
            document.getElementById('search_loading').innerHTML = "<div class='text-success text-center'><br><br><br><h4><i class='fa fa-spinner fa-spin'></i><b> Aguarde, Buscando Informação da Ordem de Produção !</b></h4></div>";
        },

        openSuccess(a, b) {
            document
                .querySelector('.modal-overlay_v5')
                .classList
                .add('active')

            document.getElementById('content_success_a').innerHTML = a;
            document.getElementById('content_success_b').innerHTML = b;
        },
        closeSuccess() {
            let getData = Production.getOrdem();
            document
                .querySelector('.modal-overlay_v5')
                .classList
                .remove('active')

        },


        openError(a, b) {
            document
                .querySelector('.modal-overlay_v3')
                .classList
                .add('active')

            document.getElementById('content_problem').innerHTML = a;
            document.getElementById('content_solution').innerHTML = b;
        },
        closeError(a = '') {

            let getData = Production.getOrdem();
            document
                .querySelector('.modal-overlay_v3')
                .classList
                .remove('active')

            if (getData.length == 0) {

                App.exit();

            }

        }
    }

    const DOM = {
        innerHTMLTInformation() {
            let getQuant = Production.getCount();
            getData = Production.getOrdem();
            document.getElementById('s').innerHTML = (getData.ordem[0].C2_STATUS == 'P' ? 'Em Produção' : 'Encerrado');

            if (getData.ordem[0].C2_STATUS != 'P') {
                document.getElementById('s').className = "h1 font-weight-bold text-danger";

            }

            date_a = Utils.formatDate(getQuant.data_hora).split(" ")

            document.getElementById('a').innerHTML = getData.ordem[0].B1_TIPO + ' - ' + getData.ordem[0].C2_OP;
            document.getElementById('b').innerHTML = getData.ordem[0].C2_PRODUTO;
            document.getElementById('c').innerHTML = getData.ordem[0].C2_QUANT;
            document.getElementById('d').innerHTML = date_a[0];
            document.getElementById('e').innerHTML = getData.ordem[0].B1_DESC;
            document.getElementById('f').innerHTML = getData.ordem[0].B1_QE;
            document.getElementById('g').innerHTML = getData.ordem[0].C2_LOCAL;
            document.getElementById('h').innerHTML = getData.ordem[0].B1_UM;
            document.getElementById('i').innerHTML = getData.ordem[0].B1_XQTAG;
            document.getElementById('j').innerHTML = getData.ordem[0].C2_QUJE;
            document.getElementById('l').innerHTML = getData.ordem[0].C2_SALDO;
            document.getElementById('m').innerHTML = getData.count_apont;
            document.getElementById('t').innerHTML = getQuant.tempo + ' Minuto(s)';
        },
        innerHTMLQuantidade() {

            getData = Production.getCount();
            if (getData.length != 0) {
                document.getElementById('quantidade').innerHTML = getData.quantidade;
                document.getElementById('t').innerHTML = getData.tempo + ' Minuto(s)';

            }

        },
        innerHTMLPrcial() {

            DOM.blockConponentes("apontamento_parcial")
            document.getElementById('info_parcial').innerHTML = "<p>Existe um Apontamrnto Parcial de Produção! Finalize a Produção.</p>";
        },
        innerHTMLError() {

            DOM.blockConponentes("apontamento_parcial")
            document.getElementById('info_parcial').innerHTML = "<p>Sistema Protheus Parado, Informe a T.I.</p>";
        },

        innerListApontProductions() {

            let getData = Production.getOrdem();
            let list = "";

            if (getData.apontamentos.length != 0) {

                getData.apontamentos.map(function (data, i) {

                    dataap = data.H6_DTAPONT.substring(0, 4) + '-' + data.H6_DTAPONT.substring(4, 6) + '-' + data.H6_DTAPONT.substring(6, 8) + ' ' + data.H6_XHORA
                    list += '<tr>'
                    list += ' <td>' + data.D3_QUANT + '</td>'
                    list += ' <td>' + Utils.formatDate(dataap) + '</td>'
                    list += ' <td>' + data.H6_TEMPO + '</td>'
                    list += ' </tr>'
                })
                document.getElementById('list_apont').innerHTML = list;
            }
        },

        reset() {

            let i = 1;
            let getData = Production.getOrdem();
            let getParametro = Parameter.getParam();

         //   if (getParametro.MV_SOCKET == 'S') {

              //  Socket._whiteSerial(getData.ordem[0].B1_XCICLO)

          //  } else {


                if (getData.ordem[0].B1_XCICLO > 1) {

                    while (i <= 20) {


                        fetch(`http://127.0.0.1:5000/api/v1/arotubi/serialwrite?pulso=${getData.ordem[0].B1_XCICLO}`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Headers': '*',
                                'X-Api-Key': 'QWEASDZXC123456789QWEASDZXC'
                            }
                        });

                        i++;
                    }

                }
            //}

        },

        async updateHTMLQuant(flag) {

            Utils.clearTime();
            let getParametro = Parameter.getParam();
            //const timeout = 15000;
            const controller = new AbortController();
            //const id = setTimeout(() => controller.abort(), timeout);
            let quant = 0;
            let getData = Production.getOrdem();
            let getError = Production.getError()
            let ret = true
            let x_ciclo

            // console.log(flag);

            if (flag && getData.ordem[0].C2_STATUS === 'P' && getError.length === 0 && flag_Acerto === 0) {

                let getData = Production.getOrdem();
                let getQuant = Production.getCount();
                x_ciclo = parseInt(getData.ordem[0].B1_XCICLO)

                try {


                    const data = await fetch(`http://127.0.0.1:5000/api/v1/arotubi/serial`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Headers': '*',
                            'X-Api-Key': 'QWEASDZXC123456789QWEASDZXC'
                        }
                    });

                    if (data.status == 201 || data.status == 200) {

                        let port = await data.json()

                        if (port.data == "1") {

                            document.getElementById('quantidade').className = "text-success font310";

                            sinal_port = sinal_port + 1;


                            if (flag_port == 0 && sinal_port == 1) {

                                quant = parseInt(getQuant.quantidade) + 1

                                await Production.updateCount(quant, 0);
                                await Production.setCount();
                                await DOM.innerHTMLQuantidade();
                                getQuant = await Production.getCount();

                                flag_sinal = 1;

                                document.getElementById('z').innerHTML = flag_ciclo;

                            }

                        } 
                        if (port.data == "0") {

                            document.getElementById('quantidade').className = "text-warning font310";

                            flag_sinal = 0
                            sinal_port = 0
                            Modal.closeError();


                        }

                        //console.log(getQuant.quantidade)
                        //console.log(getData.ordem[0].B1_QE)


                        if (getData.ordem[0].B1_TIPO == 'PA') {


                            if (parseInt(getQuant.quantidade) === parseInt(getData.ordem[0].B1_QE)) {

                                App.pause();

                                tempo = Math.floor(Math.random() * 300);

                                setTimeout(() => {

                                    console.log(tempo)

                                }, tempo);

                                ret = await Production.insertProducao('total');


                            }
                        }


                        if (getData.ordem[0].B1_TIPO == 'PI') {

                            if ((getParametro.MV_APNMULT == 'N' || parseInt(getData.ordem[0].B1_QE) == 0) && parseInt(getQuant.quantidade) > 0) {

                                DOM.enableConponente('apont_parcial')
                                ret = true


                            } else if (parseInt(getData.ordem[0].B1_QE) > 0) {

                                DOM.disableConponente('apont_parcial')


                                if (parseInt(getQuant.quantidade) === parseInt(getData.ordem[0].B1_QE)) {


                                    App.pause();

                                    tempo = Math.floor(Math.random() * 300);

                                    setTimeout(() => {

                                        console.log(tempo)

                                    }, tempo);

                                    ret = await Production.insertProducao('total');

                                }
                            }

                        }

                        cont = 0;
                    } else {

                        let port = await data.json()

                        cont = cont + 1

                        if (cont === 10) {

                            Modal.openError('Sem conexão com a Contadora.', 'Aguarde...')
                            setTimeout(function () {
                                Modal.closeError()
                            }, 5000);

                        }
                        if (cont === 40) {

                            Modal.openError('Sem conexão com a Contadora.', 'Informe a T.I.')
                            Utils.clearTime();

                        }
                        ret = true

                    }

                    clearTimeout(idTimeout);

                    if (ret) {

                        idTimeout = setTimeout(function () {
                            App.play();
                        }, 1000);
                    }



                } catch (error) {

                    cont = cont + 1

                    if (cont === 40) {
                        Modal.openError('Sem conexão com a Contadora.', 'Informe a T.I.')

                    }
                }

            } else {

                Utils.clearTime();
            }
        },


        hideConponente(id) {

            document.getElementById(id).style.display = "none";

        },
        showConponente(id) {

            document.getElementById(id).style.display = "block";

        },
        noneConponentes(id) {

            document.getElementById(id).style.display = "none";
        },
        blockConponentes(id) {

            document.getElementById(id).style.display = "block";
        },
        focusConponente(id) {

            document.getElementById(id).focus()

        },
        enableConponente(id) {

            document.getElementById(id).disabled = false;
        },
        disableConponente(id) {

            document.getElementById(id).disabled = true;
        },
        clearConponente(id) {

            var elem = document.getElementById(id);


            if (elem !== null) {
                document.getElementById(id).value = "";
            }

        }
    }
    const Storage = {
        getDados(key) {
            return JSON.parse(sessionStorage.getItem(key)) || []
        },
        setDados(key, dados) {

            sessionStorage.setItem(key, JSON.stringify(dados))
        },
        deleteDados() {
            sessionStorage.clear()
        }
    }
    const Production = {

        async setAcerto() {

            Modal.closeAcerto();

            let getData = await Production.getOrdem();
            let quantAcerto = document.getElementById('acertoQuant').value
            let acertoTempo = document.getElementById('acertoTempo').value
            DOM.clearConponente('acertoQuant')


            if (parseInt(acertoTempo) == 0) {

                Modal.openError('Informe o Tempo de Produção. Em minutos ! ', 'Refaça a Operação.')

            } else if (parseInt(quantAcerto) > getData.ordem[0].B1_QE && getData.ordem[0].B1_QE > 0) {


                Modal.openError('Valor do Acerto tem que ser Menor ou Igual ao Multiplo da Embalagem. ', 'Refaça a Operação.')

            } else {

                await Production.updateCount(quantAcerto, acertoTempo)

            }

            await Production.setOrdem(getData.ordem[0].C2_OP)


        },


        async insertOrdem(n) {

            let getData = Production.getOrdem();
            let getParametro = Parameter.getParam();
            let resp;
            let a = '';
            let dataserver = await Utils.timeserver();
            const data = await fetch(`http://localhost/sistema/application/controller/producao.php?filial=${getData.ordem[0].C2_FILIAL.trim()}&op=${getData.ordem[0].C2_OP}&multpc=${getData.ordem[0].B1_XQTAG}&a=${a}&data=${dataserver}&produto=${getData.ordem[0].C2_PRODUTO}&linha=${getParametro.MV_CODMAQ}&acao=insertOrdem`, {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Headers': '*',
                    'X-Api-Key': 'QWEASDZXC123456789QWEASDZXC'
                }
            })

            if (data.status == 201 || data.status == 200) {

                resp = await data.json();
                if (resp.errorCode == "") {
                    return;
                }

            }
        },

        async setOrdem(a, error = '') {

            App.pause();
            let getParametro = Parameter.getParam();
            let ret;
            let i = 1;
            Utils.clearTime();


            if (a.length == 11) {

                DOM.clearConponente('ordemProducao');

                if (error === '') {
                    //   a = '21570401001';
                    Modal.loadingSearch()

                    try {
                        const data = await fetch(`http://localhost:5000/api/v1/arotubi/ordem?op=${a}`, {
                            method: "GET",
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Headers': '*',
                                'X-Api-Key': 'QWEASDZXC123456789QWEASDZXC'
                            }
                        })

                        if (data.status == 201 || data.status == 200) {

                            ret = await data.json();


                            if (ret.status !== 'error') {

                                Modal.closeSearch();
                                Storage.setDados("ordem.producao", ret)
                                await Production.setCount('new');
                                await DOM.innerHTMLTInformation();

                                await DOM.innerHTMLQuantidade();
                                getData = await Production.getOrdem();

                                await DOM.innerListApontProductions();
                                DOM.showConponente('etqapond')



                                if (ret.parcial > 0) {
                                    DOM.innerHTMLPrcial();
                                } else {
                                    DOM.noneConponentes("apontamento_parcial")
                                }

                                if (getData.ordem[0].B1_QE > 0 || getData.ordem[0].B1_TIPO == 'PI') {

                                    if (getData.ordem[0].C2_STATUS == 'P') {

                                        if (getParametro.MV_ACERTO != 'N') {

                                            DOM.enableConponente('acerto')
                                        } else {
                                            DOM.disableConponente('acerto')

                                        }
                                        
                                        DOM.reset()
                                        App.play();

                                    } else {

                                        App.pause();
                                        DOM.disableConponente('acerto')
                                    }
                                } else {

                                    Modal.closeSearch();
                                    Modal.openError('Multiplo da Embalagem Não Cadastrado.', 'Informe o PCP.')
                                }

                            } else {

                                Modal.closeSearch();
                                Modal.openError(ret.errorMessage, 'Informe ao Lider De Produção.')

                            }
                        } else {
                            Modal.closeSearch();
                            Modal.openError('01 -Sistema Protheus Parado.', 'Informe a T.I.')
                            Storage.setDados('error', '1')
                            DOM.innerHTMLError()
                        }
                    } catch (err) {


                        Modal.closeSearch();
                        Modal.openError('02 -Sistema Protheus Parado.', 'Informe a T.I.')
                        Storage.setDados('error', '1')
                        DOM.innerHTMLError()
                    }

                } else {
                    Modal.closeSearch();
                    Modal.openError('03 - Sistema Protheus Parado.', 'Informe a T.I.')
                    Storage.setDados('error', '1')
                    DOM.innerHTMLError()
                }

            }
        },
        getOrdem() {

            return Storage.getDados("ordem.producao");
        },
        getError() {

            return Storage.getDados("error");
        },

        async setCount(a = '') {

            let getData = Production.getOrdem();
            let getParametro = Parameter.getParam();

            const data = await fetch(`http://localhost/sistema/application/controller/producao.php?filial=${getData.ordem[0].C2_FILIAL.trim()}&op=${getData.ordem[0].C2_OP}&multpc=${getData.ordem[0].B1_XQTAG}&a=${a}&produto=${getData.ordem[0].C2_PRODUTO}&linha=${getParametro.MV_CODMAQ}&acao=getQuantidade`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Headers': '*'
                }
            })

            if (data.status == 201 || data.status == 200) {

                resp = await data.json();


                if (resp.errorCode == "999") {

                    await Production.insertOrdem();
                    await Production.setCount();
                }


                Storage.setDados("quantidade", resp)
            }
        },
        getCount() {

            return Storage.getDados("quantidade");
        },

        async updateCount(quant, tempo) {


            let getData = Production.getOrdem();
            let getParametro = Parameter.getParam();
            let a = '';

            const data = await fetch(`http://localhost/sistema/application/controller/producao.php?filial=${getData.ordem[0].C2_FILIAL.trim()}&op=${getData.ordem[0].C2_OP}&multpc=${getData.ordem[0].B1_XQTAG}&a=${a}&quant=${quant}&produto=${getData.ordem[0].C2_PRODUTO}&linha=${getParametro.MV_CODMAQ}&tempo=${tempo}&acao=updateOrdem`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Headers': '*'
                }
            })

            if (data.status == 201 || data.status == 200) {

                resp = await data.json();
            }


        },

        async printEtiqueta(a) {

            let getData;
            let ret;
            getData = Production.getOrdem();

            Modal.openSuccess('<b>Imprimindo a Etiqueta !!!', 'Aguarde !!!</b>')

            const data = await fetch(`http://127.0.0.1:5000/api/v1/arotubi/etiqueta?op=${getData.ordem[0].C2_OP}&seq=${a}&filial=${getData.ordem[0].C2_FILIAL.trim()}&tamanho=10x15&tipo=${getData.ordem[0].B1_TIPO}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Headers': '*',
                    'X-Api-Key': 'QWEASDZXC123456789QWEASDZXC'
                }
            })


            if (data.status == 201 || data.status == 200) {

                Modal.closeSuccess();
                ret = await data.json();

                if (ret.status == "success") {

                    // Production.setOrdem(getData.ordem[0].C2_OP)

                } else {
                    Modal.openError(ret.errorMessage, 'Informe ao PCP e Reimprima a Etiqueta.')
                }
            }
        },

        async errorEtiqueta(a, b, c, d, e) {

            let getData;
            let ret;
            getData = Production.getOrdem();

            const data = await fetch(`http://127.0.0.1:5000/api/v1/arotubi/erroretiqueta?op=${b}&error=${a}&quant=${c}&hora_ini=${d}&hora_fim=${e}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Headers': '*',
                    'X-Api-Key': 'QWEASDZXC123456789QWEASDZXC'
                }
            })


            if (data.status == 201 || data.status == 200) {

                return;
            } else {

                return;
            }
        },

        async insertProducao(type, options = {}) {

            App.pause();
            DOM.disableConponente('acerto')
            DOM.disableConponente('apont_parcial')


            if (flag_apont == 0) {
            
                Modal.openSuccess('Realizando Apontamento de Produção !!!', ' Aguarde ')


                flag_apont == 1

                let timeout = 10000; // Tempo limite de 5 segundos
                let getQuant = Production.getCount();
                let getData = Production.getOrdem();
                let getParametro = Parameter.getParam();
                let resp;
                let quantidade;
                let tempo = await Utils.calcTempoProd()
                let rest = ''
                let grupofilial = getParametro.MV_GRUPO_EMP + getData.ordem[0].C2_FILIAL.trim()
                let grupo = getParametro.MV_GRUPO_EMP 
                let filial = getData.ordem[0].C2_FILIAL.trim()
                let ordem = getData.ordem[0].C2_OP
                let codMaq = getParametro.MV_CODMAQ
                let tempoIni = tempo[0].split("T");
                let tempoFim = tempo[1].split("T");
                let motivo = '';

                if (getData.ordem[0].C2_FILIAL.trim() == '020101' && getParametro.MV_GRUPO_EMP == '01') {

                    rest = getParametro.MV_URLREST01020101

                }
                if (getData.ordem[0].C2_FILIAL.trim() == '030101' && getParametro.MV_GRUPO_EMP == '01') {

                    rest = getParametro.MV_URLREST01030101

                }
                if (getData.ordem[0].C2_FILIAL.trim() == '010101' && getParametro.MV_GRUPO_EMP == '02') {

                    rest = getParametro.MV_URLREST02010101

                }
                if (getData.ordem[0].C2_FILIAL.trim() == '020101' && getParametro.MV_GRUPO_EMP == '02') {

                    rest = getParametro.MV_URLREST02020101

                }


                if (type == 'total') {

                    quantidade = getData.ordem[0].B1_QE

                } else {

                    quantidade = getQuant.quantidade

                }

                

                try {


                    xhr.open('POST', `${rest}/AROTUBI_APAUT001?GRUPO=${grupo}&FILIALA=${filial}&ORDEM=${ordem}&QUANTEMB=${quantidade}&EQUIPAMENTO=${codMaq}&TEMPO=${tempo[2]}&DATAINI=${tempoIni[0]}&HORAINI=${tempoIni[1]}&DATAFIM=${tempoFim[0]}&HORAFIM=${tempoFim[1]}&OBS=${motivo}`, false); 
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.setRequestHeader("Authorization", "Basic " + btoa(getParametro.MV_USER_PROTHEUS + ":" + getParametro.MV_USER_PASS));
                    xhr.setRequestHeader("tenantId", `${getParametro.MV_GRUPO_EMP},${getParametro.MV_FILIAL.trim()}`);
                    xhr.setRequestHeader("x-erp-module", "SIGAPCP");


                    var timer = setTimeout(function () {
                        xhr.abort(); 
                        console.log('Timeout da requisição');
                    }, timeout);

                    xhr.onreadystatechange = function () {
                        if (xhr.readyState === 4) {
                            clearTimeout(timer); 


                            if (xhr.status === 200 || xhr.status === 201) {



                                console.log(xhr.responseText);

                                resp = JSON.parse(xhr.responseText);



                                if (resp.Code == '001') {

                                    Modal.closeSuccess()

                                    Production.printEtiqueta(resp.Message)

                                    Production.updateCount(0, 0)

                                    Production.setOrdem(getData.ordem[0].C2_OP)

                                    flag_apont == 0;

                                    return true;

                                }

                            } else if (xhr.status === 404) {


                                Modal.closeSuccess()
                                resp = JSON.parse(xhr.responseText);
                                Modal.openError('404 - Sistema Protheus Parado. Informe a T.I.', '')

                                Production.updateCount(0, 0)
                                Production.setCount()
                                DOM.innerHTMLQuantidade()
                                Storage.deleteDados();

                                Production.errorEtiqueta(Utils.removeAcento('Sistema Protheus Parado. Informe a T.I.'), getData.ordem[0].C2_OP, quantidade, tempo[0], tempo[1])

                                return false;
                            } else if (xhr.status === 500) {


                                Modal.closeSuccess()
                              
                                resp = JSON.parse(xhr.responseText);
                                Modal.openError(resp.errorMessage, ' 500 - Informe ao PCP. Assim que o problema for resolvido, Tente Novamente.')
                                let error = resp.errorMessage
                                console.log(xhr.responseText)
                                console.log(resp.errorMessage)
                                console.log(error)

                                Production.updateCount(0, 0)
                                Production.setCount()
                                DOM.innerHTMLQuantidade()
                                Storage.deleteDados();


                                Production.errorEtiqueta(error, getData.ordem[0].C2_OP, quantidade, tempo[0], tempo[1])

                                return false;


                            } else {

                                Modal.closeSuccess()

                                Modal.openError('400 - Sistema Protheus Parado. Informe a T.I.', '')

                                Production.updateCount(0, 0)
                                Production.setCount()
                                DOM.innerHTMLQuantidade()
                                Storage.deleteDados();

                                Production.errorEtiqueta(Utils.removeAcento('Sistema Protheus Parado. Informe a T.I.'), getData.ordem[0].C2_OP, quantidade, tempo[0], tempo[1])

                                return false;
                            }
                        } else {

                            Modal.closeSuccess()

                            Modal.openError('400 - Sistema Protheus Parado. Informe a T.I.', '')

                            Production.updateCount(0, 0)
                            Production.setCount()
                            DOM.innerHTMLQuantidade()
                            Storage.deleteDados();

                            Production.errorEtiqueta(Utils.removeAcento('Sistema Protheus Parado. Informe a T.I.'), getData.ordem[0].C2_OP, quantidade, tempo[0], tempo[1])

                            return false;

                        }
                    };

                    xhr.addEventListener('abort', function () {
                        Modal.closeSuccess()

                        Modal.openError(' 400 - Sistema Protheus Parado. Informe a T.I.', '')

                        Production.updateCount(0, 0)
                        Production.setCount()
                        DOM.innerHTMLQuantidade()
                        Storage.deleteDados();

                        Production.errorEtiqueta(Utils.removeAcento('Sistema Protheus Parado. Informe a T.I.'), getData.ordem[0].C2_OP, quantidade, tempo[0], tempo[1])

                        return false;
                    });

                    xhr.send();

                } catch (e) {

                    console.log(e)

                    await Production.updateCount(0, 0)
                    await Production.setCount()
                    Modal.closeSuccess()
                    Modal.openError(' 501 - Sistema Protheus Parado. Informe a T.I.', 'Assim que o Problema for Resolvido, Refaça a Operação.')
                    await Production.errorEtiqueta('Sistema Protheus Parado', getData.ordem[0].C2_OP, quantidade, tempo[0], tempo[1])
                    Storage.deleteDados();
                    return false;
                }
            }

        }
    }
    const Socket = {

        _connect() {

            console.log(socket)

            if (!socket) {

                console.log('wwwwwwwwwwwwwwwwwwwww')
                socket = io('http://127.0.0.1:5001');
            }
        },

        _disconnect() {
             if (socket) {
                socket.disconnect();
                console.log('Socket desconectado.');
                socket = null;  // Limpar a referência para garantir que o socket seja recriado ao reconectar
            }
        },

        _whiteSerial(message) {

            socket.emit('white_serial', message + '\n');

        },

        _readSerial() {

           socket.on('receive_data', async function(port) {

                let getData = Production.getOrdem();
                let getQuant = await Production.getCount();
                let getParametro = Parameter.getParam();


                try {

                    // console.log(port)

                    if (port.status == 'success') {


                        if (port.data == "1" && flag_Acerto == 0) {

                          
                            sinal_port = sinal_port + 1;


                            if (sinal_port == 1) {

                                quant = parseInt(getQuant.quantidade) + 1
                                //console.log(quant)
                                document.getElementById('quantidade').className = "text-success font310";

                                await Production.updateCount(quant, 0); // ok
                                await Production.setCount();

                                await DOM.innerHTMLQuantidade();
                                //getQuant = Production.getCount();

                                flag_sinal = 1;

                                document.getElementById('z').innerHTML = flag_ciclo;

                            }

                        }
                        if (port.data == "0" && flag_Acerto == 0) {

                            document.getElementById('quantidade').className = "text-warning font310";

                            flag_sinal = 0
                            sinal_port = 0
                            Modal.closeError();


                        }

                        //console.log(getQuant.quantidade)
                        //console.log(getData.ordem[0].B1_QE)


                        if (getData.ordem[0].B1_TIPO == 'PA' && flag_Acerto == 0) {


                            // console.log(getQuant.quantidade)
                            // console.log(getData.ordem[0].B1_QE)

                            if (parseInt(getQuant.quantidade) === parseInt(getData.ordem[0].B1_QE)) {

                                App.pause();

                                tempo = Math.floor(Math.random() * 300);

                                setTimeout(() => {

                                    // console.log(tempo)

                                }, tempo);

                                //ret = Production.insertProducao('total');


                            }
                        }

                        //console.log(getData.ordem[0].B1_TIPO)
                        //console.log(getParametro.MV_APNMULT)


                        if (getData.ordem[0].B1_TIPO == 'PI' && flag_Acerto == 0) {

                            if ((getParametro.MV_APNMULT == 'N' || parseInt(getData.ordem[0].B1_QE) == 0) && parseInt(getQuant.quantidade) > 0) {

                                DOM.enableConponente('apont_parcial')
                                ret = true


                            } else if (parseInt(getData.ordem[0].B1_QE) > 0) {

                                DOM.disableConponente('apont_parcial')


                                if (parseInt(getQuant.quantidade) === parseInt(getData.ordem[0].B1_QE)) {


                                    App.pause();

                                    tempo = Math.floor(Math.random() * 300);

                                    setTimeout(() => {

                                        // console.log(tempo)

                                    }, tempo);

                                    alert('apontando')

                                    // ret = Production.insertProducao('total');

                                }
                            }

                        }

                        if (cont >= 60) {

                            Modal.closeError();
                        }

                        cont = 0;

                    } else {

                        cont = cont + 1
                        //  console.log(cont)

                        if (cont === 60) {
                            Modal.openError('Sem conexão com a Contadora.', 'Informe a T.I.')

                        }
                    }

                } catch (error) {

                    cont = cont + 1

                    if (cont === 60) {
                        Modal.openError('Sem conexão com a Contadora.', 'Informe a T.I.')

                    }

                }
            });
        },
        _openSerial() {

            if (socket) {
                socket.emit('open_port');
            }

        },
        _closeSerial() {
            if (socket) {
                socket.emit('close_port');
            }
        }
    }
    const App = {
        init() {
            App.reload();
            Parameter.setParam();
            Modal.openSearch();
            DOM.focusConponente('ordemProducao')
        },
        reload() {
            Storage.deleteDados();
            DOM.clearConponente('ordemProducao');
            DOM.disableConponente('apont_parcial')
            DOM.noneConponentes("apontamento_parcial")
            DOM.clearConponente('acertoQuant')
        },

        pause() {

            let getParametro = Parameter.getParam();

            if (getParametro.MV_SOCKET == 'S') {


                flag_Acerto = 1;

            } else {
                clearTimeout(idTimeout);
                Utils.clearTime();
                DOM.updateHTMLQuant(false);
            }
        },
        play() {
            let getParametro = Parameter.getParam();

            if (getParametro.MV_SOCKET == 'S') {

                if (flag_socket == 0) {
                    flag_socket = 1;
                    Socket._connect();
                    Socket._openSerial();
                    Socket._readSerial();
                }
                flag_Acerto = 0;

            } else {
                DOM.updateHTMLQuant(true);
            }

        },
        exit() {

            Storage.deleteDados();
            Socket._closeSerial();
            window.location.href = "http://localhost/sistema";
        },
    }
    App.init()
</script>
