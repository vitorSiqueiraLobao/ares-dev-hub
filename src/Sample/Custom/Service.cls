/// Classe customizada de exemplo para InterSystems IRIS
/// Compilação via terminal telnet com /overwrite
Class Sample.Custom.Service Extends %RegisteredObject
{

/// Método de exemplo
ClassMethod GetInfo(pId As %Integer) As %String
{
    Set status = $$$OK
    Try {
        If (pId <= 0) {
            Return "{""error"": ""Invalid ID""}"
        }
        Set retorno = "{""id"": " _ pId _ ", ""status"": ""ACTIVE""}"
        Return retorno
    }
    Catch ex {
        Set status = ex.AsStatus()
        Do $system.Status.DisplayError(status)
        Return "{""error"": """ _ ex.DisplayString() _ """}"
    }
}

}
