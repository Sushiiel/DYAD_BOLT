import com.sap.gateway.ip.core.customdev.util.Message
import java.util.HashMap

def Message processData(Message message) {
    // Get current Employee XML from Splitter
    def body = message.getBody(java.lang.String) as String
    def xml = new XmlSlurper().parseText(body)

    def fullName  = xml.FullName.text()
    def dept      = xml.Department.text()
    def salary    = xml.Salary.text()
    def email     = xml.Email.text()
    def joinDate  = xml.JoiningDate.text()

    // Build SQL INSERT string
    def sql = """INSERT INTO EMPLOYEE ("FULL_NAME","DEPARTMENT","SALARY","EMAIL","JOINING_DATE")
    VALUES ('$fullName','$dept',$salary,'$email','$joinDate')"""

    // Set SQL string as new message body
    message.setBody(sql)
    return message
}
