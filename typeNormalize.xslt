<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:bf="http://id.loc.gov/ontologies/bibframe/" 
    xmlns:madsrdf="http://www.loc.gov/mads/rdf/v1#" 
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" 
    xmlns:lclocal="http://id.loc.gov/ontologies/lclocal/" 
    xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#" 
    xmlns:pmo="http://performedmusicontology.org/ontology/" 
    xmlns:datatypes="http://id.loc.gov/datatypes/" 
    xmlns:bflc="http://id.loc.gov/ontologies/bflc/" 
    xmlns:xsd="http://www.w3.org/2001/XMLSchema#"
    version="2.0">
    
    <xsl:strip-space elements="*"/>
    <xsl:output omit-xml-declaration="yes" indent="yes"/>
    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
    </xsl:template>
    
    <xsl:template match="bf:hasInstance/bf:Print | rdf:RDF/bf:Print">
        <bf:Instance>
            <xsl:attribute name="rdf:about"><xsl:value-of select="@rdf:about"/></xsl:attribute>
            <rdf:type rdf:resource='http://id.loc.gov/ontologies/bibframe/Print'/>
            <xsl:apply-templates/>
        </bf:Instance>
    </xsl:template>
    
    <xsl:template match="bf:hasInstance/bf:Electronic | rdf:RDF/bf:Electronic">
        <bf:Instance>
            <xsl:attribute name="rdf:about"><xsl:value-of select="@rdf:about"/></xsl:attribute>
            <rdf:type rdf:resource='http://id.loc.gov/ontologies/bibframe/Electronic'/>
            <xsl:apply-templates/>
        </bf:Instance>
    </xsl:template>
   
    <xsl:template match="bf:hasInstance/bf:Manuscript | rdf:RDF/bf:Manuscript">
        <bf:Instance>
            <xsl:attribute name="rdf:about"><xsl:value-of select="@rdf:about"/></xsl:attribute>
            <rdf:type rdf:resource='http://id.loc.gov/ontologies/bibframe/Manuscript'/>
            <xsl:apply-templates/>
        </bf:Instance>
    </xsl:template>
    
    <xsl:template match="bf:hasInstance/bf:Archival | rdf:RDF/bf:Archival">
        <bf:Instance>
            <xsl:attribute name="rdf:about"><xsl:value-of select="@rdf:about"/></xsl:attribute>
            <rdf:type rdf:resource='http://id.loc.gov/ontologies/bibframe/Archival'/>
            <xsl:apply-templates/>
        </bf:Instance>
    </xsl:template>
    
    <xsl:template match="bf:hasInstance/bf:Tactile | rdf:RDF/bf:Tactile">
        <bf:Instance>
            <xsl:attribute name="rdf:about"><xsl:value-of select="@rdf:about"/></xsl:attribute>
            <rdf:type rdf:resource='http://id.loc.gov/ontologies/bibframe/Tactile'/>
            <xsl:apply-templates/>
        </bf:Instance>
    </xsl:template>
    
    <xsl:template match="rdf:RDF/bf:Text | bf:instanceOf/bf:Text">
        <bf:Work>
            <xsl:attribute name="rdf:about"><xsl:value-of select="@rdf:about"/></xsl:attribute>
            <rdf:type rdf:resource='http://id.loc.gov/ontologies/bibframe/Text'/>
            <xsl:apply-templates/>
        </bf:Work>
    </xsl:template>
    
    <xsl:template match="rdf:RDF/bf:Cartography | bf:instanceOf/bf:Cartography">
        <bf:Work>
            <xsl:attribute name="rdf:about"><xsl:value-of select="@rdf:about"/></xsl:attribute>
            <rdf:type rdf:resource='http://id.loc.gov/ontologies/bibframe/Cartography'/>
            <xsl:apply-templates/>
        </bf:Work>
    </xsl:template>
    
    <xsl:template match="rdf:RDF/bf:Audio | bf:instanceOf/bf:Audio">
        <bf:Work>
            <xsl:attribute name="rdf:about"><xsl:value-of select="@rdf:about"/></xsl:attribute>
            <rdf:type rdf:resource='http://id.loc.gov/ontologies/bibframe/Audio'/>
            <xsl:apply-templates/>
        </bf:Work>
    </xsl:template>
    
    <xsl:template match="rdf:RDF/bf:NotatedMusic | bf:instanceOf/bf:NotatedMusic">
        <bf:Work>
            <xsl:attribute name="rdf:about"><xsl:value-of select="@rdf:about"/></xsl:attribute>
            <rdf:type rdf:resource='http://id.loc.gov/ontologies/bibframe/NotatedMusic'/>
            <xsl:apply-templates/>
        </bf:Work>
    </xsl:template>
    
    <xsl:template match="rdf:RDF/bf:NotatedMovement | bf:instanceOf/bf:NotatedMovement">
        <bf:Work>
            <xsl:attribute name="rdf:about"><xsl:value-of select="@rdf:about"/></xsl:attribute>
            <rdf:type rdf:resource='http://id.loc.gov/ontologies/bibframe/NotatedMovement'/>
            <xsl:apply-templates/>
        </bf:Work>
    </xsl:template>
    
    <xsl:template match="rdf:RDF/bf:Dataset | bf:instanceOf/bf:Dataset">
        <bf:Work>
            <xsl:attribute name="rdf:about"><xsl:value-of select="@rdf:about"/></xsl:attribute>
            <rdf:type rdf:resource='http://id.loc.gov/ontologies/bibframe/Dataset'/>
            <xsl:apply-templates/>
        </bf:Work>
    </xsl:template>
    
    <xsl:template match="rdf:RDF/bf:StillImage | bf:instanceOf/bf:StillImage">
        <bf:Work>
            <xsl:attribute name="rdf:about"><xsl:value-of select="@rdf:about"/></xsl:attribute>
            <rdf:type rdf:resource='http://id.loc.gov/ontologies/bibframe/StillImage'/>
            <xsl:apply-templates/>
        </bf:Work>
    </xsl:template>
    
    <xsl:template match="rdf:RDF/bf:MovingImage | bf:instanceOf/bf:MovingImage">
        <bf:Work>
            <xsl:attribute name="rdf:about"><xsl:value-of select="@rdf:about"/></xsl:attribute>
            <rdf:type rdf:resource='http://id.loc.gov/ontologies/bibframe/MovingImage'/>
            <xsl:apply-templates/>
        </bf:Work>
    </xsl:template>
    
    <xsl:template match="rdf:RDF/bf:Object | bf:instanceOf/bf:Object">
        <bf:Work>
            <xsl:attribute name="rdf:about"><xsl:value-of select="@rdf:about"/></xsl:attribute>
            <rdf:type rdf:resource='http://id.loc.gov/ontologies/bibframe/Object'/>
            <xsl:apply-templates/>
        </bf:Work>
    </xsl:template>
    
    <xsl:template match="rdf:RDF/bf:Multimedia | bf:instanceOf/bf:Multimedia">
        <bf:Work>
            <xsl:attribute name="rdf:about"><xsl:value-of select="@rdf:about"/></xsl:attribute>
            <rdf:type rdf:resource='http://id.loc.gov/ontologies/bibframe/Multimedia'/>
            <xsl:apply-templates/>
        </bf:Work>
    </xsl:template>
    
    <xsl:template match="rdf:RDF/bf:MixedMaterial | bf:instanceOf/bf:MixedMaterial">
        <bf:Work>
            <xsl:attribute name="rdf:about"><xsl:value-of select="@rdf:about"/></xsl:attribute>
            <rdf:type rdf:resource='http://id.loc.gov/ontologies/bibframe/MixedMaterial'/>
            <xsl:apply-templates/>
        </bf:Work>
    </xsl:template>
   
    <xsl:template match="rdf:type[@rdf:resource='http://id.loc.gov/ontologies/bibframe/Instance']"/>
    <xsl:template match="rdf:type[@rdf:resource='http://id.loc.gov/ontologies/bibframe/Work']"/>
    
</xsl:stylesheet>
